import type { Attribute, IAttributeService } from "../types"
import { low } from "./fs"

class AttributeService implements IAttributeService {
  setAttributes = async (docId: number, attributes: Omit<Attribute, 'docId'>[]) => {
    let attrs: Attribute[] = []
    await low.update(meta => {
      meta.document.forEach(item => {
        if (item.id !== docId) return;
        attributes.forEach(attr => {
          const exist = item.attributes.find(i => i.key === attr.key)
          if (exist) {
            exist.value = attr.value
          } else {
            item.attributes.push({ docId, key: attr.key, value: attr.value })
          }
        })
        attrs = item.attributes
      })
    })
    return { errCode: 0, errMsg: 'ok', data: attrs }
  }
}

export const attributeService = new AttributeService()