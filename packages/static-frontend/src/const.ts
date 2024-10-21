export const PUBLIC_KEY_PATH = 'data/articles/publicKey.pem'
export const PRIVATE_KEY = 'POST_PRIVATE_KEY'

export const ARTICLE_DIR = 'data/articles'
export const ADMIN_STORAGE_KEY = 'adminConfig'

export const getArticlePath = (id: number | string) => `${ARTICLE_DIR}/${id}/`
export const getArticleContentPath = (id: number | string) => `${ARTICLE_DIR}/${id}/index.json`
export const getArticleFilePath = (id: number | string, name: string) => `${ARTICLE_DIR}/${id}/files/${name}`
export const parseArticleFileName = (path: string, id: number | string) => {
  const prefix = `${ARTICLE_DIR}/${id}/files/`
  if (path.startsWith(prefix)) {
    return path.substring(prefix.length)
  }
  return ''
}

export interface IArticle {
  createdAt: string
  updatedAt: string
  title: string
  content: string,
  encrypted?: boolean,
}