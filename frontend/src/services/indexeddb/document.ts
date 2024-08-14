import { createLogger } from "@/utils/logger"
import type { Document, IDocumentService } from "../types"
import { db } from "./db"
import { attributeService } from "./attribute"

const logger = createLogger('indexeddb/document')

class DocumentService implements IDocumentService {
  constructor() {
    this.insertRootIfNotExist()
  }

  private insertRootIfNotExist = async () => {
    const row = await db.document.where('path').equals('').first()
    if (row) return
    // @ts-ignore
    return db.document.put({
      title: 'root',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      nextId: null,
      attributes: [],
      content: JSON.stringify({
        type: 'doc',
        content: [
          {
            "type": "paragraph",
            "attrs": {
              "align": "left"
            },
            "content": [
              {
                "type": "text",
                "text": "这是根文档"
              }
            ]
          }
        ],
      }),
      path: '',
    })
  }

  findMany = async () => {
    const list = await db.document.filter(() => true).toArray()
    const listWithAttrs = await Promise.all(list.map(async item => {
      return {
        ...item,
        attributes: await attributeService.getAttributes(item.id)
      }
    }))
    logger.i('findMany', listWithAttrs)
    return {
      errCode: 0,
      errMsg: 'ok',
      data: {
        total: list.length,
        list: listWithAttrs
      }
    }
  }
  find = async (where: { id: number }) => {
    const data = await db.document.where({ id: where.id }).first()
    const document = {
      ...data!,
      attributes: await attributeService.getAttributes(where.id)
    }
    return { errCode: 0, errMsg: 'ok', data: document }
  }
  update = (data: Pick<Partial<Document>, 'id' | 'title' | 'content'>) => {
    const { id, ...updateData } = data;
    return db.document.update(id as number, { ...updateData, updatedAt: new Date().toISOString() }).then(() => ({ errCode: 0, errMsg: 'ok', data: null }))
  }
  updateMany = (data: { id: number, path: string, nextId: number | null }[]) => {
    return Promise.all(data.map(({ id, ...updateData }) => {
      return db.document.update(id as number, { ...updateData, updatedAt: new Date().toISOString() })
    })).then(() => ({ errCode: 0, errMsg: 'ok', data: { success: true } }))
  }
  remove = async (where: { id: number }) => {
    const cur = (await db.document.get(where.id))!
    await db.document.where('nextId').equals(where.id).modify({ nextId: cur!.nextId })
    await db.document.delete(where.id)
    await db.document.where('path').startsWith(`${cur.path}/${cur.id}`).delete()
    return { errCode: 0, errMsg: 'ok', data: null }
  }
  add = (data: Pick<Document, 'title' | 'content' | 'path'>) => {
    const row = {
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      nextId: null,
      attributes: [],
    }
    // @ts-ignore
    return db.document.add(row).then(id => {
      return { errCode: 0, errMsg: 'ok', data: { ...row, id } }
    })
  }
  findByShareId = async (where: { id: string }) => {
    const attribute = await db.attribute.where('key').equals('share').filter(i => i.value === where.id).first()
    
    if (!attribute) { throw new Error('Not Found' + where.id) }

    return { errCode: 0, errMsg: 'ok', data: {
      key: attribute.key,
      value: attribute.value,
      doc: (await db.document.where('id').equals(attribute!.docId).first())!
    } }
  }
}

export const documentService = new DocumentService()