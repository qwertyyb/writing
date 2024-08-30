import { Buffer } from 'buffer';
import { Octokit } from "@octokit/rest";
import type { IFileServer } from './base';

const debounce = <F extends (...args: any[]) => Promise<any>>(fn: F, duration = 300) => {
  let timeout: ReturnType<typeof setTimeout>
  let resolvers: ((value: ReturnType<F>) => void)[] = []
  return (...args: Parameters<F>): ReturnType<F> => {
    if (timeout) {
      clearTimeout(timeout)
    }
    // @ts-ignore
    return new Promise(resolve => {
      resolvers.push(resolve)
      timeout = setTimeout(() => {
        fn(...args).then(result => {
          resolvers.forEach(item => item(result))
          resolvers = []
        })
      }, duration)
    })
  }
}

const noMulti = <F extends (...args: any[]) => any>(fn: F, getKey: (...args: Parameters<F>) => string) => {
  const valueMap = new Map<string, ReturnType<F>>()
  return (...args: Parameters<F>): ReturnType<F> => {
    const key = getKey(...args)
    const value = valueMap.get(key)
    if (value) return value
    const result = fn(...args).finally(() => {
      valueMap.delete(key)
    })
    valueMap.set(key, result)
    return valueMap.get(key)!
  }
}

export class GithubServer implements IFileServer {
  github: Octokit
  writeDebounceMap = new Map<string, (content: Blob | File) => Promise<unknown>>()
  constructor(private options: { auth: string, owner: string, repo: string }) {
    this.github = new Octokit({
      auth: options.auth,
      request: {
        fetch: (...args: Parameters<typeof fetch>) => {
          return fetch(args[0], {
            ...args[1],
            headers: {
              ...args[1]?.headers,
              'If-None-Match': '' // 禁用缓存
            }
          })
        }
      }
    })
  }
  private getSha = async (path: string) => {
    const { data: treeData } = await this.github.rest.git.getTree({
      owner: this.options.owner,
      repo: this.options.repo,
      tree_sha: 'main',
      recursive: 'true'
    })
    return treeData.tree.find(i => i.path === path)?.sha
  }
  readJSON = noMulti(async (path: string) => {
    try {
      const { data } = await this.github.rest.repos.getContent({
        owner: this.options.owner,
        repo: this.options.repo,
        path,
        headers: {
          accept: 'application/vnd.github.raw+json'
        }
      })
      if (typeof data === 'string') {
        try {
          return JSON.parse(data)
        } catch(err) {
          return null
        }
      }
    } catch (err) {
      if ((err as any).status === 404) {
        return null
      }
      throw err
    }
    return null
  }, (path) => path)
  writeJSON = async (json: any, path: string) => {
    const content = new Blob([JSON.stringify(json)], { type: 'application/json' })
    await this.writeFile(content, path)
  }
  writeFile = async (content: Blob | File, path: string) => {
    if (!this.writeDebounceMap.get(path)) {
      this.writeDebounceMap.set(path, debounce(async (content: Blob | File) => {
        await this.github.repos.createOrUpdateFileContents({
          owner: this.options.owner,
          repo: this.options.repo,
          path,
          message: `update ${path}`,
          sha: await this.getSha(path),
          content: Buffer.from(await content.arrayBuffer()).toString('base64')
        })
      }, 300))
    }
    return this.writeDebounceMap.get(path)!(content)
  }

  readFile = noMulti(async (path: string) => {
    try {
      const { data } = await this.github.rest.repos.getContent({
        owner: this.options.owner,
        repo: this.options.repo,
        path,
        headers: {
          accept: 'application/vnd.github.object+json'
        }
      })
      if ('content' in data) {
        try {
          if (data.content) {
            return new Blob([Buffer.from(data.content, data.encoding as BufferEncoding).buffer])
          }
          const response = await fetch(data.download_url!)
          return response.blob()
        } catch(err) {
          return null
        }
      }
    } catch (err) {
      if ((err as any).status === 404) {
        return null
      }
      throw err
    }
    return null
  }, path => path)

  removeFile = async (path: string) => {
    const { data } = await this.github.rest.repos.getContent({
      owner: this.options.owner,
      repo: this.options.repo,
      path,
    })
    if (!('sha' in data)) return
    await this.github.rest.repos.deleteFile({
      owner: this.options.owner,
      repo: this.options.repo,
      path,
      message: `remove ${path}`,
      sha: data.sha
    })
  }
}