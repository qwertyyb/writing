import { randomString } from "@/utils/utils"
import type { IFileService } from "../types"
import { fsServer, low } from "./fs"

class FileService implements IFileService {
  upload = async (file: File | Blob, options?: Partial<{ name: string, mimetype: string }>) => {
    const fileMeta = {
      name: randomString(),
      mimetype: (file as any).mimetype,
      createdAt: new Date().toUTCString(),
      ...options,
    }
    await fsServer.writeFile(file, fileMeta.name)
    await low.update(meta => {
      meta.file.push(fileMeta)
    })

    return { errCode: 0, errMsg: 'ok', data: { url: 'xxxx' } }
  }
  check = (query?: Partial<{
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
    }).map(item => ({ ...item, url: 'xxx', documents: [] }))
    return Promise.resolve({ errCode: 0, errMsg: 'ok', data: files })
  }
  remove = async (names: string[]) => {
    await Promise.all(names.map(name => {
      return fsServer.removeFile(name)
    }))
    return { errCode: 0, errMsg: 'ok', data: { count: names.length } }
  }
}

export const fileService = new FileService()