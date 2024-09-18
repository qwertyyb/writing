import { Buffer } from 'buffer';
import { Octokit } from "@octokit/rest";
import { type Action, ACTION_EVENT_NAME, event } from './ActionEvent.ts';
import type { PostWithContent } from '../../shared/types/index.d.ts';
import { GITHUB_PUBLISHER_AUTH, GITHUB_PUBLISHER_OWNER, GITHUB_PUBLISHER_REPO } from '../config.ts';
import { createLogger } from '../utils/logger.ts';

const logger = createLogger('GithubPublisher')

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

export class GithubServer {
  github: Octokit
  writeDebounceMap = new Map<string, (content: Blob | File) => Promise<unknown>>()
  sha: Record<string, string> = {}
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
  private updateSha = async () => {
    const { data: treeData } = await this.github.rest.git.getTree({
      owner: this.options.owner,
      repo: this.options.repo,
      tree_sha: 'main',
      recursive: 'true'
    })
    this.sha = treeData.tree.reduce<Record<string, string>>((acc, item) => {
      return { ...acc, [item.path!]: item.sha! }
    }, {})
  }
  // 当返回409时，更新sha后重试
  retryAfterUpdateSha = async <F extends () => Promise<any>>(fn: F) => {
    try {
      return await fn()
    } catch (err: any) {
      if ('status' in err && (err.status === 409 || err.status === 422)) {
        await this.updateSha()
      }
      return fn()
    }
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
        return this.retryAfterUpdateSha(async () => {
          const res = await this.github.repos.createOrUpdateFileContents({
            owner: this.options.owner,
            repo: this.options.repo,
            path,
            message: `update ${path}`,
            sha: this.sha[path],
            content: Buffer.from(await content.arrayBuffer()).toString('base64')
          })
          this.sha[path] = res.data.content!.sha!
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
    let sha = this.sha[path]
    if (!sha) {
      await this.updateSha()
    }
    sha = this.sha[path]
    if (!sha) return
    await this.github.rest.repos.deleteFile({
      owner: this.options.owner,
      repo: this.options.repo,
      path,
      message: `remove ${path}`,
      sha: sha
    })
  }
}

const shared = (post: PostWithContent) => post.attributes.find(attr => attr.key === 'share')

const getFiles = (post: PostWithContent) => {
  const reg = /\/api\/v1\/file\?name=([^"]+)/g
  const pathList = [...post.content.matchAll(reg)]
  return pathList.map((match) => ({ path: match[0], name: match[1] }))
}

const transformFiles = async (post: PostWithContent) => {
  const files = getFiles(post)
  const fileContents = (await Promise.allSettled(files.map(async (file) => {
    const response = await fetch(`http://localhost:${4080}${file.path}`)
    if (response.ok) {
      return {
        ...file,
        blob: await response.blob()
      }
    }
    throw new Error('request file failed')
  })))
    .map(item => item.status === 'fulfilled' && item.value)
    .filter(Boolean) as { path: string, name: string, blob: Blob }[]
  return {
    files: fileContents,
    post: {
      ...post,
      content: files.reduce((content, file) => {
        return content.replaceAll(file.path, `./server/files/${file.name}`)
      }, post.content)
    }
  }
}

const handleAction = (gs: GithubServer) => {
  return async (action: Action) => {
    const { type, payload } = action
    if (type === 'addPost' || type === 'updatePost') {
      if (shared(payload)) {
        const { files, post } = await transformFiles(payload)
        files.forEach(file => {
          gs.writeFile(file.blob, `server/files/${file.name}`)
        })
        gs.writeJSON(post, `server/posts/${payload.id}.json`)
      } else {
        const files = getFiles(payload)
        files.forEach(file => {
          gs.removeFile(`server/files/${file.name}`)
        })
        gs.removeFile(`server/posts/${payload.id}.json`)
      }
    } else if (type === 'removePost') {
      gs.removeFile(`server/posts/${payload.id}.json`)
    } else if (type === 'removeFile') {
      payload.names.forEach((name) => {
        gs.removeFile(`server/files/${name}`)
      })
    }
  }
}

export const startGithubPublisher = () => {
  if (GITHUB_PUBLISHER_AUTH && GITHUB_PUBLISHER_OWNER && GITHUB_PUBLISHER_REPO) {
    const githubServer = new GithubServer({
      auth: GITHUB_PUBLISHER_AUTH,
      owner: GITHUB_PUBLISHER_OWNER,
      repo: GITHUB_PUBLISHER_REPO,
    })
    event.on(ACTION_EVENT_NAME, handleAction(githubServer))
  } else {
    logger.w('auth、owner、repo not found')
  }
}