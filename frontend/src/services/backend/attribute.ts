import type { Attribute } from "../types"
import { apiFetch } from "./fetch"

class AttributeService {
  setAttributes = (docId: number, attributes: Attribute[]) => {
    return apiFetch<Attribute[]>('/api/v1/attribute/update', {
      method: 'PATCH',
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify({ docId, attributes })
    })
  }
}

export const attributeService = new AttributeService()