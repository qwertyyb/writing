import type { Attribute, IAttributeService } from "../types"
import { apiFetch } from "./fetch"

class AttributeService implements IAttributeService {
  setAttributes = (docId: number, attributes: Omit<Attribute, 'docId'>[]) => {
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