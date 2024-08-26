import type { IAttribute, IAttributeService } from "../types"
import type { createFetch } from "./fetch"

export class AttributeService implements IAttributeService {
  constructor(private fetch: ReturnType<typeof createFetch>) { }
  setAttributes = (docId: number, attributes: Omit<IAttribute, 'docId'>[]) => {
    return this.fetch<IAttribute[]>('/api/v1/attribute/update', {
      method: 'PATCH',
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify({ docId, attributes })
    })
  }
}
