import { Buffer } from 'buffer'
import { Octokit } from "@octokit/rest";
import { computed, onMounted, onUnmounted, ref } from "vue";
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

export const getArticlePath = (id: number | string) => `${ARTICLE_DIR}/${id}/`
export const getArticleContentPath = (id: number | string) => `${ARTICLE_DIR}/${id}/index.json`
const getArticleFilePath = (id: number | string, name: string) => `${ARTICLE_DIR}/${id}/files/${name}`
const parseArticleFileName = (path: string, id: number | string) => {
  const prefix = `${ARTICLE_DIR}/${id}/files/`
  if (path.startsWith(prefix)) {
    return path.substring(prefix.length)
  }
  return ''
}

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
  // octokit.rest.repos.get({ owner, repo })
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

type TreeItem = {
  type: "blob" | "tree" | "commit",
  sha?: string | null,
  content?: string,
  path: string,
  mode?: "100644" | "100755" | "040000" | "160000" | "120000"
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
    const isNew = id === 'new'
    if (isNew) {
      // 新的文章，获取一个id
      // 用时间取一个id
      // targetId = new Date().toISOString().substring(0, 19).replace(/[^\d]/g, '')
      targetId = newArticleId
    }
    // 新建的文章，把临时路径替换成目标路径
    const article = JSON.stringify(state.value.local).replaceAll(getArticleFilePath('new', ''), getArticleFilePath(targetId, ''))
    // 文件也需要发布
    const keys = await localdb.keys()
    const files = keys.filter(key => key.startsWith('file:'))
    if (!files.length) {
      // 没有文件需要提交，只提交文章本身即可
      await github.rest.repos.createOrUpdateFileContents({
        owner, repo, path: getArticleContentPath(targetId),
        message: `update ${targetId}`,
        content: new Buffer(article).toString('base64'),
        sha: state.value.git?.sha // 更新需要sha
      })
    } else {
      // 1. 上传文件
      const tree: {
        type: "blob" | "tree" | "commit",
        sha?: string,
        content?: string,
        path: string,
        mode?: "100644" | "100755" | "040000" | "160000" | "120000"
      }[] = await Promise.all(files.map(async key => {
        const name = key.replace(/^file:/, '')
        const content: Blob = (await localdb.getItem(key))!
        try {
          const filePath = getArticleFilePath(targetId, name)
          const { data: { sha } } = await github.rest.git.createBlob({
            owner, repo, content: Buffer.from(await content.arrayBuffer()).toString('base64'),
            encoding: 'base64'
          })
          return { type: 'blob', sha, path: filePath, mode: '100644' }
        } catch (err) {
          throw new Error(`文件${name}上传失败: ${(err as any).message}`, { cause: err })
        }
      }))

      // 2. 获取 baseTree
      const { data: { sha: baseTreeSha } } = await github.rest.git.getTree({ owner, repo, tree_sha: 'main' })

      // 3. 创建 tree
      tree.push({ type: 'blob', content: article, path: getArticleContentPath(targetId), mode: '100644' })
      const { data: { sha: newTreeSha } } = await github.rest.git.createTree({ owner, repo, tree, base_tree: baseTreeSha })

      // 4. 获取 base commit
      const { data: { object: { sha: baseCommitSha } } } = await github.rest.git.getRef({ owner, repo, ref: 'heads/main' })

      // 4. 创建 commit
      const { data: { sha: newCommitSha } } = await github.rest.git.createCommit({ owner, repo, message: `${id === 'new' ? '新增' : '更新'} ${targetId}`, tree: newTreeSha, parents: [ baseCommitSha ] })

      // 5. 更新 ref
      await github.rest.git.updateRef({ owner, repo, ref: 'heads/main', sha: newCommitSha })
    }

    // 发布后清空本地
    await localdb.clear()
  }

  const imageHandler = async (event: ErrorEvent) => {
    const target = event.target as HTMLImageElement
    if (target.nodeName.toLocaleLowerCase() !== 'img') return
    const src = target.getAttribute('src')
    if (!src || target.dataset.blobUrl === src) return
    const name = parseArticleFileName(src, id)
    if (!name) return
    const blob: Blob | null = await localdb.getItem(`file:${name}`)
    if (!blob) return
    const blobUrl = URL.createObjectURL(blob)
    target.dataset.blobUrl = blobUrl
    target.src = blobUrl
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

  onMounted(() => {
    document.body.addEventListener('error', imageHandler, true)
  })

  onUnmounted(() => {
    document.body.removeEventListener('error', imageHandler, true)
  })

  return {
    startEditArticle,
    updateEditingArticle,
    publishArticle,
    uploadFile
  }
}