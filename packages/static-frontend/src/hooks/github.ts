import { Octokit } from "@octokit/rest"
import { adminConfig } from "./admin"
import { getArticleContentPath, PUBLIC_KEY_PATH } from "@/const"
import { Buffer } from "buffer"
import { tryRunForTuple } from "try-run-js"

export const createGithubClient = (): Octokit => {
  const { token } = adminConfig.value
  const octokit = new Octokit({
    auth: token,
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
  return octokit
}

export const getGitArticle = async (id: number | string) => {
  const { owner, repo } = adminConfig.value
  const octokit = createGithubClient()
  const response = await octokit.rest.repos.getContent({
    owner, repo, path: getArticleContentPath(id),
    headers: {
      'Content-Type': 'application/vnd.github.raw+json'
    }
  })
  // octokit.rest.repos.get({ owner, repo })
  if ('content' in response.data && 'encoding' in response.data) {
    const buffer = new Buffer(response.data.content, response.data.encoding)
    const text = buffer.toString('utf-8')
    return { sha: response.data.sha, article: JSON.parse(text) }
  }
}

export const deleteArticle = async (id: number | string) => {
  const data = await getGitArticle(id)
  if (!data) {
    throw new Error(`文章${id}不存在`)
  }
  const github = createGithubClient()
  const { owner, repo } = adminConfig.value
  github.rest.repos.deleteFile({ owner, repo, path: getArticleContentPath(id), message: `删除 ${id}`, sha: data.sha })
}

export const updatePublicKey = async (publicKey: string) => {
  const { owner, repo } = adminConfig.value
  const github = createGithubClient()
  const [error, response] = await tryRunForTuple(github.rest.repos.getContent({
    owner, repo, path: PUBLIC_KEY_PATH
  }))
  if (error.response?.status !== 404) {
    throw error
  }
  const sha = error.response?.status === 404 ? '' : 'sha' in response!.data ? 'sha' : ''
  await github.repos.createOrUpdateFileContents({
    owner, repo, path: PUBLIC_KEY_PATH,
    message: `update public key`,
    content: new Buffer(publicKey).toString('base64'),
    sha: sha // 更新需要sha
  })
}

export const fetchPublicKey = async () => {
  const { owner, repo } = adminConfig.value
  const octokit = createGithubClient()
  const response = await octokit.rest.repos.getContent({
    owner, repo, path: PUBLIC_KEY_PATH,
    headers: {
      'Content-Type': 'application/vnd.github.raw+json'
    }
  })
  // octokit.rest.repos.get({ owner, repo })
  if ('content' in response.data && 'encoding' in response.data) {
    const buffer = new Buffer(response.data.content, response.data.encoding)
    const text = buffer.toString('utf-8')
    return { sha: response.data.sha, publicKey: text }
  }
}