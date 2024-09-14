import type { IDocument, IDocumentService } from "../types"
import type { createFetch } from "./fetch"

export class DocumentService implements IDocumentService {
  constructor(private fetch: ReturnType<typeof createFetch>) { }
  findMany = () => {
    return this.fetch<{ total: number, list: Omit<IDocument, 'content'>[] }>('/api/v1/post/list')
  }
  find = (where: { id: number }) => {
    return this.fetch<IDocument>('/api/v1/post/query?id=' + where.id)
  }
  update = (data: Pick<Partial<IDocument>, 'id' | 'title' | 'content'>) => {
    return this.fetch<Pick<IDocument, 'id' | 'title'>>('/api/v1/post/update', {
      method: 'PATCH',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify(data)
    })
  }
  updateMany = (data: { id: number, path: string, nextId: number | null }[]) => this.fetch<{ success: boolean }>('/api/v1/post/move', {
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
    return this.fetch('/api/v1/post/remove?' + searchParams.toString(), {
      method: 'DELETE',
      headers: {
        'content-type': 'application/json'
      }
    })
  }
  add = (data: Pick<IDocument, 'title' | 'content' | 'path'>) => {
    return this.fetch<Omit<IDocument, 'content'>>('/api/v1/post/add', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify(data)
    })
  }
  findByShareId = (where: { id: string }) => {
    return this.fetch<{key: string, value: string, doc: IDocument}>('/api/v1/public/get?id=' + where.id)
  }
}