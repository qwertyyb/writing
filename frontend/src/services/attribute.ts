import { apiFetch } from "./fetch"

export interface Attribute {
  key: string,
  value: string,
}

export const setAttributes = (docId: number, attributes: Attribute[]) => {
  return apiFetch<Attribute[]>('/api/v1/attribute/update', {
    method: 'PATCH',
    headers: {
      'content-type': 'application/json'
    },
    body: JSON.stringify({ docId, attributes })
  })
}