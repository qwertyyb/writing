import { randomString } from "@/utils/utils"
import { db, type BlobFile } from "./db"
import type { IFileService, IDocument } from "../types"

const FILE_BASE_PATH = '/api/v1/indexeddb/fileNotExist'

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
    const row = await db.file.get(name)
    if (!row) return null
    const url = URL.createObjectURL(row.content)
    this.blobUrls.set(name, url)
    return url
  }
  private removeBlobUrl = async (name: string) => {
    const url = this.blobUrls.get(name)
    if (!url) return
    URL.revokeObjectURL(url)
  }
  private getDocumentsByFileNames = async (names: string[]) => {
    const results: Record<string, IDocument[]> = names.reduce((acc, name) => ({ ...acc, [name]: [] }), {})
    await db.document.each(document => {
      names.forEach(name => {
        const fileUrl = `${FILE_BASE_PATH}?name=${name}`
        if (document.content.includes(fileUrl)) {
          results[name].push(document)
        }
      })
    })
    return results
  }

  upload = async (file: File | Blob) => {
    const name = randomString()
    await db.file.put({
      name,
      content: file,
      createdAt: new Date().toISOString(),
      mimetype: file.type
    })
    // 监听图片error事件，替换掉路径为blob URL
    return { errCode: 0, errMsg: 'ok', data: { url: `${FILE_BASE_PATH}?name=${name}` } }
  }
  check = async (query?: Partial<{
    start: Date;
    end: Date;
    mimetype: string;
  }>) => {
    let files: BlobFile[] = []
    if (query && query.start && query.end && query.mimetype) {
      files = await db.file.where('createdAt').between(query.start, query.end).and(item => item.mimetype === query?.mimetype).toArray()
    } else if (query && query.start && query.end) {
      files = await db.file.where('createdAt').between(query.start, query.end).toArray()
    } else if (query && query.mimetype) {
      files = await db.file.where('mimetype').equals(query.mimetype).toArray()
    } else {
      files = await db.file.toArray()
    }
    const docs = await this.getDocumentsByFileNames(files.map(file => file.name))
    return {
      errCode: 0, errMsg: 'ok',
      data: files.map(file => ({ ...file, url: `${FILE_BASE_PATH}?name=${file.name}`, documents: docs[file.name] }))
    }
  }
  remove = async (names: string[]) => {
    const count = await db.file.where('name').anyOf(...names).delete()
    names.forEach(this.removeBlobUrl)
    return { errCode: 0, errMsg: 'ok', data: { count } }
  }
}

export const fileService = new FileService()