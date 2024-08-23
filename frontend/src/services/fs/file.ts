import { randomString } from "@/utils/utils"
import type { IFileService, Document } from "../types"
import { fsServer, low } from "./fs"

const FILE_BASE_PATH = '/api/v1/fs/fileNotExist'

const FILE_DIR_PATH = 'resources'

class FileService implements IFileService {
  constructor() {
    document.body.addEventListener('error', async (event) => {
      const target = event.target as HTMLImageElement
      if (target.nodeName.toLocaleLowerCase() !== 'img') return
      if (target.dataset.blobUrl === target.src) return
      const url = new URL(target.src)
      const name = url.searchParams.get('name')
      if (url.pathname !== FILE_BASE_PATH || !name) return
      const blobUrl = await this.createBlobUrl(name)
      if (!blobUrl) return
      target.dataset.blobUrl = blobUrl
      target.src = blobUrl
    }, true)
  }

  private blobUrls = new Map<string, string>()

  private createBlobUrl = async (name: string) => {
    const file = await fsServer.readFile(`resources/${name}`)
    if (!file) return null
    const url = URL.createObjectURL(file)
    this.blobUrls.set(name, url)
    return url
  }
  private removeBlobUrl = async (name: string) => {
    const url = this.blobUrls.get(name)
    if (!url) return
    URL.revokeObjectURL(url)
  }
  private getFileUrl = (name: string) => {
    return `${FILE_BASE_PATH}?name=${name}`
  }
  private getDocumentsByFileNames = async (names: string[]) => {
    const results: Record<string, Document[]> = names.reduce((acc, name) => ({ ...acc, [name]: [] }), {})
    await low.data.document.forEach(async document => {
      const file = await fsServer.readFile(`posts/${document.id}.json`)
      const content = await file.text()
      names.forEach(name => {
        const fileUrl = this.getFileUrl(name)
        if (content.includes(fileUrl)) {
          results[name].push(document)
        }
      })
    })
    return results
  }

  upload = async (file: File | Blob, options?: Partial<{ name: string, mimetype: string }>) => {
    console.log(file)
    const fileMeta = {
      name: (file as File).name || randomString(),
      mimetype: file.type,
      createdAt: new Date().toUTCString(),
      ...options,
    }
    console.log(fileMeta)
    await fsServer.writeFile(file, `${FILE_DIR_PATH}/${fileMeta.name}`)
    await low.update(meta => {
      meta.file.push(fileMeta)
    })

    return { errCode: 0, errMsg: 'ok', data: { url: this.getFileUrl(fileMeta.name) } }
  }
  check = async (query?: Partial<{
    start: Date,
    end: Date,
    mimetype: string
  }>) => {
    const params = new URLSearchParams()
    query?.start && params.append('start', query.start.toISOString())
    query?.end && params.append('end', query.end.toISOString())
    query?.mimetype && params.append('mimetype', query.mimetype)
    const min = query?.start ? query.start.getTime() : 0
    const max = query?.end ? query.end.getTime() : Number.MAX_SAFE_INTEGER
    const files = low.data.file.filter(f => {
      const createdAt = new Date(f.createdAt).getTime()
      return createdAt >= min && createdAt <= max && (!query?.mimetype || query.mimetype && query.mimetype === f.mimetype)
    })
    const docs = await this.getDocumentsByFileNames(files.map(file => file.name))

    return {
      errCode: 0,
      errMsg: 'ok',
      data: files.map(file => ({ ...file, url: this.getFileUrl(file.name), documents: docs[file.name] })) 
    }
  }
  remove = async (names: string[]) => {
    await Promise.all(names.map(name => {
      this.removeBlobUrl(name)
      return fsServer.removeFile(name)
    }))
    return { errCode: 0, errMsg: 'ok', data: { count: names.length } }
  }
}

export const fileService = new FileService()