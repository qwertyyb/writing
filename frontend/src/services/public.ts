import { apiFetch } from "./fetch"
import type { Document } from "./document"

export const getDocumentByShareId = (where: { id: string }) => {
  return apiFetch<{key: string, value: string, doc: Document}>('/api/v1/public/get?id=' + where.id)
}