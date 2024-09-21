import type { IWritingAttribute } from "@writing/types"
import type { IAttribute, IAttributeService } from "../types"
import type { createFetch } from "./fetch"

export class AttributeService implements IAttributeService {
  constructor(private fetch: ReturnType<typeof createFetch>) { }
  setAttributes = (docId: number, attributes: IWritingAttribute[]) => {
    return this.fetch<IAttribute[]>('/api/v1/attribute/update', {
      method: 'PATCH',
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify({ docId, attributes })
    })
  }
  removeAttributes = (docId: number, keys: string[]) => {
    return this.fetch<null>('/api/v1/attribute/remove', {
      method: 'POST',
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify({ docId, keys })
    })
  }
}
