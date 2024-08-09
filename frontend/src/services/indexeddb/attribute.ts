import type { Attribute } from "../types"
import { db } from "./db"

class AttributeService {
  setAttributes = async (docId: number, attributes: Omit<Attribute, 'docId'>[]) => {
    const items = attributes.map(item => ({ ...item, docId }))
    await db.attribute.bulkPut(items)
    return { data: items }
  }
  getAttributes = async (docId: number) => {
    return db.attribute.where('docId').equals(docId).toArray()
  }
}

export const attributeService = new AttributeService()