import * as path from 'node:path'
import * as fs from 'node:fs/promises'

interface IArticle {
  id: string
  title: string
  content: string
  createdAt: string
  updatedAt: string
}

const getDataPath = () => {
  const dataPath = process.argv[2]
  if (!dataPath) throw new Error('未指定 data 目录')
  if (path.isAbsolute(dataPath)) return dataPath
  return path.join(process.cwd(), dataPath)
}

const getArticles = async (dataPath: string) => {
  const articlesPath = 'articles'
  let names = await fs.readdir(path.join(dataPath, articlesPath))
  names = names.filter(name => !name.startsWith('.') && !path.extname(name))
  const results = await Promise.allSettled(names.map(name => {
    const articlePath = path.join(dataPath, articlesPath, name, './index.json')
    return fs.readFile(articlePath, { encoding: 'utf-8' }).then(articleStr => {
      const { content, ...rest } = JSON.parse(articleStr) as IArticle
      return { ...rest, id: name }
    })
  }))
  const articles = results.reduce<Omit<IArticle, 'content'>[]>((arr, result) => {
    if (result.status === 'fulfilled') {
      return [...arr, result.value]
    }
    return arr
  }, [])
  return articles.toSorted((prev, next) => {
    return new Date(next.createdAt).getTime() - new Date(prev.createdAt).getTime()
  })
}

const writeArticles = async (dataPath: string, articles: Omit<IArticle, 'content'>[]) => {
  const targetPath = path.join(dataPath, 'articles/list.json')
  return fs.writeFile(targetPath, JSON.stringify(articles))
}

const start = async () => {
  console.log('argv:', process.argv)
  const dataPath = getDataPath()
  console.log('data path:', dataPath)
  const articles = await getArticles(dataPath)
  console.log('articles:\n', articles)
  return writeArticles(dataPath, articles)
}

start()