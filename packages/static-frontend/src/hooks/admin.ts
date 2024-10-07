import { Buffer } from 'buffer'
import { Octokit } from "@octokit/rest";
import { computed, ref } from "vue";
import localforage from 'localforage'
import { getPost } from '@/services';

interface IArticle {
  createdAt: string
  updatedAt: string
  title: string
  content: string
}

interface IAdminConfig {
  token: string
  repo: string
  owner: string
}

const ARTICLE_DIR = 'data/articles'
const STORAGE_KEY = 'adminConfig'

const getArticleContentPath = (id: number | string) => `${ARTICLE_DIR}/${id}/index.json`
const getArticleFilePath = (id: number | string, name: string) => `${ARTICLE_DIR}/${id}/files/${name}`


const adminConfig = ref({
  token: '', owner: '', repo: ''
})

const hasConfig = () => {
  return adminConfig.value.token && adminConfig.value.owner && adminConfig.value.repo
}

const loadConfig = () => {
  const data = localStorage.getItem(STORAGE_KEY)
  if (!data) return
  adminConfig.value = JSON.parse(data)
}

loadConfig()

export const useAdminConfig = () => {

  const saveConfig = async (config: { token: string, owner: string, repo: string }) => {
    await localStorage.setItem(STORAGE_KEY, JSON.stringify(config))
    loadConfig()
  }

  const clearConfig = async () => {
    await localforage.removeItem(STORAGE_KEY)
    adminConfig.value = { token: '', owner: '', repo: '' }
  }

  return {
    config: adminConfig,
    loadConfig,
    saveConfig,
    clearConfig,
    hasConfig: computed(hasConfig)
  }
}


const createGithubClient = () => {
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

const getGitArticle = async (id: number | string) => {
  const { owner, repo } = adminConfig.value
  const octokit = createGithubClient()
  const response = await octokit.rest.repos.getContent({
    owner, repo, path: getArticleContentPath(id),
    headers: {
      'Content-Type': 'application/vnd.github.raw+json'
    }
  })
  if ('content' in response.data && 'encoding' in response.data) {
    const buffer = new Buffer(response.data.content, response.data.encoding)
    const text = buffer.toString('utf-8')
    return { sha: response.data.sha, article: JSON.parse(text) }
  }
}

const getServerArticle = async (id: number | string) => {
  const data: IArticle = await getPost(id)
  return data
}

export const useArticleStatus = () => {
  const loading = ref(false)
  const status = ref<'removing' | 'updating' | 'deploying' | 'default'>('default')

  const getArticleStatus = async (id: number | string) => {
    if (!hasConfig()) return;
    loading.value = true
    try {
      const [server, git] = await Promise.all([
        getServerArticle(id),
        getGitArticle(id)
      ])
      // server 有，git 没有，该文章正在被删除
      if (server && !git) {
        status.value = 'removing'
      } else if (!server && git) {
        status.value = 'deploying'
      } else if (server && git) {
        const serverDate = new Date(server.updatedAt)
        const gitDate = new Date(git.article.updatedAt)
        if (gitDate.getTime() > serverDate.getTime()) {
          // git 比 server 新，表示正在更新
          status.value = 'updating'
        }
      }
      status.value = 'default'
      loading.value = false
    } catch (err) {
      loading.value = false
      throw err
    }
  }

  return {
    loading,
    status,
    getArticleStatus
  }
}

export const useEdit = (articleId?: number | string) => {
  const state = ref<{
    server: IArticle | null,
    git: { sha: string, article: IArticle } | null,
    local: IArticle | null
  }>({
    // server files
    server: null,
    // git files
    git: null,
    // local files
    local: null
  })
  const id = articleId ?? 'new'
  const localdb = localforage.createInstance({ name: `articles/${id}` })

  const getLocalArticle = async () => {
    const data: IArticle | null = await localdb.getItem('article')
    return data
  }

  const decideEditArticle = (git: IArticle | null | undefined, local: IArticle | null) => {
    // git 没有，说明文章已删除，无法再修改
    if (!git) throw new Error('文章正在删除，无法修改')
    // 如果本地没有，则直接取 git 端的内容填充编辑器
    if (!local) return git
    // 比较local 和 git 的最后更新时间，用最新的数据
    const localDate = new Date(local.updatedAt)
    const gitDate = new Date(git.updatedAt)
    if (gitDate > localDate) return git
    return local
  }

  // 发布或更新一篇文章
  const publishArticle = async (newArticleId: string) => {
    if (!state.value.local) throw new Error('没有待发布的内容')
    if (state.value.local.updatedAt === state.value.git?.article.updatedAt) {
      throw new Error('没有更新，无须发布')
    }
    if (state.value.git && new Date(state.value.local.updatedAt).getTime() < new Date(state.value.git.article.updatedAt).getTime()) {
      // 远端的比较新，无法更新
      throw new Error('远端内容新于本地内容，无法发布')
    }
    const { owner, repo } = adminConfig.value
    const github = createGithubClient()
    let targetId = id
    if (id === 'new') {
      // 新的文章，获取一个id
      // 用时间取一个id
      // targetId = new Date().toISOString().substring(0, 19).replace(/[^\d]/g, '')
      targetId = newArticleId
    }
    await github.rest.repos.createOrUpdateFileContents({
      owner, repo, path: getArticleContentPath(targetId),
      message: `update ${targetId}`,
      content: new Buffer(JSON.stringify(state.value.local)).toString('base64'),
      sha: state.value.git?.sha // 更新需要sha
    })
    // 文件也需要发布
    const keys = await localdb.keys()
    await Promise.all(keys.filter(key => key.startsWith('file:')).map(async key => {
      const name = key.replace(/^file:/, '')
      const content: Blob = (await localdb.getItem(key))!
      try {
        github.rest.repos.createOrUpdateFileContents({
          owner, repo, path: getArticleFilePath(targetId, name),
          message: `update file ${name}`,
          content: Buffer.from(await content.arrayBuffer()).toString('base64')
        })
      } catch (err) {
        throw new Error(`文件${name}上传失败: ${(err as any).message}`, { cause: err })
      }
    }))

    // 发布后清空本地
    await localdb.clear()
  }

  const startEditArticle = async () => {
    if (id === 'new') {
      // 新增的文章只读本地
      state.value.local = await getLocalArticle()
      if (!state.value.local) {
        // 本地没有，就用初始化数据
        state.value.local = {
          title: '标题',
          content: JSON.stringify({
            type: 'doc',
            "content": [
              {
                "type": "paragraph",
                "attrs": {
                  "align": "left"
                },
                "content": [
                  {
                    "type": "text",
                    "text": "文章内容"
                  }
                ]
              }
            ]
          }),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
      }
      return state.value.local
    }
    const [git, server, local] = await Promise.all([
      getGitArticle(id),
      getServerArticle(id),
      getLocalArticle()
    ])
    state.value = {
      ...state.value,
      git: git || null, server, local
    }
    const editing = decideEditArticle(state.value.git?.article, state.value.local)
    state.value.local = JSON.parse(JSON.stringify(editing))
    return state.value.local!
  }

  const updateEditingArticle = (data: Partial<Pick<IArticle, 'title' | 'content'>>) => {
    state.value.local = {
      ...state.value.local!,
      ...data,
      updatedAt: new Date().toISOString()
    }
    localdb.setItem('article', JSON.parse(JSON.stringify(state.value.local)))
  }

  const uploadFile = async (file: File) => {
    const name = `${Date.now()}-${file.name}`
    await localdb.setItem(`file:${name}`, file)
    return getArticleFilePath(id, name)
  }

  return {
    startEditArticle,
    updateEditingArticle,
    publishArticle,
    uploadFile
  }
}