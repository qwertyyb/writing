import type { IFileService } from "../types"
import { apiFetch } from "./fetch"

class FileService implements IFileService {
  upload = async (file: File | Blob, options?: Partial<{ name: string, mimetype: string }>) => {
    const formData = new FormData()
    formData.set('file', file)
    if (options) {
      Object.entries(options).forEach(([name, value]) => {
        formData.set(name, value)
      })
    }
    return apiFetch<{ url: string }>('/api/v1/upload', {
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
    return apiFetch<{ name: string, mimetype: string, url: string, createdAt: string, documents: { id: number, title: string }[] }[]>('/api/v1/file/check?' + params.toString())
  }
  remove = (names: string[]) => apiFetch<{ count: number }>('/api/v1/file/remove', {
    method: 'POST',
    body: JSON.stringify({ names }),
    headers: {
      'content-type': 'application/json'
    }
  })
}

export const fileService = new FileService()