import type { IFileService } from "../types"
import type { createFetch } from "./fetch"

export class FileService implements IFileService {
  constructor(private fetch: ReturnType<typeof createFetch>) { }
  upload = async (file: File | Blob, options?: Partial<{ name: string, mimetype: string }>) => {
    const formData = new FormData()
    formData.set('file', file)
    if (options) {
      Object.entries(options).forEach(([name, value]) => {
        formData.set(name, value)
      })
    }
    return this.fetch<{ url: string }>('/api/v1/upload', {
      method: 'POST',
      body: formData
    })
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
    return this.fetch<{ name: string, mimetype: string, url: string, createdAt: string, documents: { id: number, title: string }[] }[]>('/api/v1/file/check?' + params.toString())
  }
  remove = (names: string[]) => this.fetch<{ count: number }>('/api/v1/file/remove', {
    method: 'POST',
    body: JSON.stringify({ names }),
    headers: {
      'content-type': 'application/json'
    }
  })
}
