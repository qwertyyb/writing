import { createLogger } from "@writing/utils/logger"
import type { Document } from "../types"
import { db } from "./db"
import { attributeService } from "./attribute"

const logger = createLogger('indexeddb/document')

class DocumentService {
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
      data: {
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
    return ({ data: document })
  }
  update = (data: Pick<Partial<Document>, 'id' | 'title' | 'content'>) => {
    const { id, ...updateData } = data;
    return db.document.update(id as number, { ...updateData, updatedAt: new Date().toISOString() })
  }
  updateMany = (data: { id: number, path: string, nextId: number | null }[]) => {
    return data.map(({ id, ...updateData }) => {
      return db.document.update(id as number, { ...updateData, updatedAt: new Date().toISOString() })
    })
  }
  remove = (where: { id: number }) => {
    return db.document.delete(where.id)
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
    return db.document.put(row).then(id => {
      return { data: { ...row, id } }
    })
  }
  findByShareId = async (where: { id: string }) => {
    const attribute = await db.attribute.where('key').equals('share').filter(i => i.value === where.id).first()
    logger.i('findByShareId', attribute)
    return { data: {
      ...attribute,
      doc: await db.document.where('id').equals(attribute!.docId).first()
    } }
  }
}

export const documentService = new DocumentService()

db.document.where('path').equals('').first().then((row) => {
  logger.i('init', row)
  if (row) return
  // @ts-ignore
  return db.document.put({
    title: 'root',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    nextId: null,
    attributes: [],
    content: JSON.stringify({
      id: 'root',
      type: 'doc',
      data: { title: 'root' },
      children: [
        {
          type: 'text',
          id: 'rootext',
          data: {
            html: '这是根文档',
          },
        },
      ],
    }),
    path: '',
  })
})
