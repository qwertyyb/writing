import type { Low } from "lowdb"
import type { IAttribute, IAttributeService } from "../types"
import type { Database } from "./fs"

export class AttributeService implements IAttributeService {
  constructor(private low: Low<Database>) {}
  setAttributes = async (docId: number, attributes: Omit<IAttribute, 'docId'>[]) => {
    let attrs: IAttribute[] = []
    await this.low.update(meta => {
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
