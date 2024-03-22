import { apiFetch } from "./fetch"

class FileService {
  upload = async (file: File | Blob) => {
    const formData = new FormData()
    formData.set('file', file)
    return apiFetch<{ url: string }>('/api/v1/upload', {
      method: 'POST',
      body: formData
    })
  }
}

export const fileService = new FileService()