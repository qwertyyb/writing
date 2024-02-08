import { apiFetch } from "./fetch"

export const upload = (file: File | Blob) => {
  const formData = new FormData()
  formData.set('file', file)
  return apiFetch<{ url: string }>('/api/v1/upload', {
    method: 'POST',
    body: formData
  })
}