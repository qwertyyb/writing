import type { Attribute } from "./attribute"
import { apiFetch } from "./fetch"


export interface Document {
  id: number,
  title: string,
  content: string,
  path: string,
  createdAt: string,
  updatedAt: string,
  attributes: Attribute[]
}

export const getList = () => {
  return apiFetch<{ total: number, list: Omit<Document, 'content' | 'attributes'>[] }>('/api/v1/document/list')
}

export const getDocument = (where: { id: number }) => {
  return apiFetch<Document>('/api/v1/document/query?id=' + where.id)
}

export const updateDocument = (data: Pick<Partial<Document>, 'id' | 'title' | 'content' | 'path'>) => {
  return apiFetch<Pick<Document, 'id' | 'title' | 'path'>>('/api/v1/document/update', {
    method: 'PATCH',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify(data)
  })
}

export const removeDocument = (where: { id: number } | { path: string }) => {
  const searchParams = new URLSearchParams()
  if ('id' in where) {
    searchParams.append('id', `${where.id}`)
  }
  if ('path' in where) {
    searchParams.append('path', where.path)
  }
  return apiFetch('/api/v1/document/remove?' + searchParams.toString(), {
    method: 'DELETE',
    headers: {
      'content-type': 'application/json'
    }
  })
}

export const addDocument = (data: Pick<Document, 'title' | 'content' | 'path'>) => {
  return apiFetch<Omit<Document, 'content' | 'attributes'>>('/api/v1/document/add', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify(data)
  })
}