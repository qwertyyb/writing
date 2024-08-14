import type { Attribute, IAttributeService } from "../types"
import { db } from "./db"

class AttributeService implements IAttributeService {
  setAttributes = async (docId: number, attributes: Omit<Attribute, 'docId'>[]) => {
    const items = attributes.map(item => ({ ...item, docId }))
    await db.attribute.bulkPut(items)
    return { errCode: 0, errMsg: 'ok', data: items }
  }
  getAttributes = async (docId: number) => {
    return db.attribute.where('docId').equals(docId).toArray()
  }
}

export const attributeService = new AttributeService()