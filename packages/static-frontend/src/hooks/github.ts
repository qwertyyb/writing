import { Octokit } from "@octokit/rest"
import { adminConfig } from "./admin"
import { getArticleContentPath } from "@/const"
import { Buffer } from "buffer"

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
