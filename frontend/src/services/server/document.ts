import type { Document, IDocumentService } from "../types"
import { apiFetch } from "./fetch"

class DocumentService implements IDocumentService {
  findMany = () => {
    return apiFetch<{ total: number, list: Omit<Document, 'content'>[] }>('/api/v1/document/list')
  }
  find = (where: { id: number }) => {
    return apiFetch<Document>('/api/v1/document/query?id=' + where.id)
  }
  update = (data: Pick<Partial<Document>, 'id' | 'title' | 'content'>) => {
    return apiFetch<Pick<Document, 'id' | 'title'>>('/api/v1/document/update', {
      method: 'PATCH',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify(data)
    })
  }
  updateMany = (data: { id: number, path: string, nextId: number | null }[]) => apiFetch<{ success: boolean }>('/api/v1/document/move', {
    method: 'PATCH',
    headers: {
      'content-type': 'application/json'
    },
    body: JSON.stringify(data)
  })
  remove = (where: { id: number }) => {
    const searchParams = new URLSearchParams()
    if ('id' in where) {
      searchParams.append('id', `${where.id}`)
    }
    return apiFetch('/api/v1/document/remove?' + searchParams.toString(), {
      method: 'DELETE',
      headers: {
        'content-type': 'application/json'
      }
    })
  }
  add = (data: Pick<Document, 'title' | 'content' | 'path'>) => {
    return apiFetch<Omit<Document, 'content'>>('/api/v1/document/add', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify(data)
    })
  }
  findByShareId = (where: { id: string }) => {
    return apiFetch<{key: string, value: string, doc: Document}>('/api/v1/public/get?id=' + where.id)
  }
}

export const documentService = new DocumentService()