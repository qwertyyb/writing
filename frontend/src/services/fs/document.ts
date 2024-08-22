import type { Document, IDocumentService, ResponseData } from "../types";
import { fsServer, low } from "./fs";

class DocumentService implements IDocumentService {
  constructor() {
    this.insertRootIfNotExist()
  }

  private insertRootIfNotExist = async () => {
    const row = low.data.document.find(i => i.path === '')
    if (row) return
    const content = JSON.stringify({
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
    })
    await fsServer.writeFile(new Blob([content], { type: 'application/json' }), `1.json`)
    await low.update(meta => {
      meta.document.push({
        id: 1,
        title: 'root',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        nextId: null,
        attributes: [],
        content: '',
        path: '',
      })
    })
  }


  async find(where: { id: number }) {
    await low.read()
    const document = low.data.document.find(item => item.id === where.id)
    const file = await fsServer.readFile(`${where.id}.json`)
    return Promise.resolve({ errMsg: 'ok', errCode: 0, data: { ...document!, content: await file.text() } })
  }
  findMany = async () => {
    await low.read()
    const list = low.data.document
    return Promise.resolve({ errCode: 0, errMsg: 'ok', data: { total: list.length, list } })
  }
  update = async (data: Pick<Document, "id"> & Partial<Pick<Document, "title" | "content">>) => {
    const { id, content, ...rest } = data
    await low.update(({ document }) => {
      const index = document.findIndex(item => item.id === id)
      if (index >= 0) {
        document[index] = { ...document[index], ...rest }
      }
    })
    if (content) {
      await fsServer.writeFile(new Blob([content], { type: 'application/json' }), `${id}.json`)
    }
    return { errCode: 0, errMsg: 'ok', data: {} }
  }
  updateMany = async (data: { id: number; path: string; nextId: number | null; }[]) => {
    await low.update((meta) => {
      meta.document.map(item => {
        data.forEach(newData => {
          if (item.id === newData.id) {
            item.path = newData.path
            item.nextId = newData.nextId
          }
        })
      })
    })
    return { errCode: 0, errMsg: 'ok', data: { success: true } }
  }
  remove = async (where: { id: number; }): Promise<ResponseData<unknown>> => {
    await low.update(meta => {
      meta.document = meta.document.filter(item => item.id !== where.id)
    })
    return { errCode: 0, errMsg: 'ok', data: null }
  };
  add = async (data: Pick<Document, "title" | "content" | "path">): Promise<ResponseData<Omit<Document, "content">>> => {
    let doc: Document | null = null
    const { content, ...rest } = data
    await low.update(meta => {
      const maxId = Math.max(...meta.document.map(item => item.id)) || 0
      const nextId = maxId + 1
      doc = {
        id: nextId, ...rest, content: '', createdAt: new Date().toUTCString(), updatedAt: new Date().toUTCString(),
        nextId: null,
        attributes: []
      }
      meta.document.push(doc)
    })
    if (content) {
      await fsServer.writeFile(new Blob([content], { type: 'application/json' }), `${doc!.id}.json`)
    }
    return { errCode: 0, errMsg: 'ok', data: doc! }
  };
  findByShareId = async (where: { id: string; }): Promise<ResponseData<{ key: string; value: string; doc: Document; }>> => {
    const doc = low.data.document.find(doc => {
      return doc.attributes.some(attr => attr.key === 'share' && attr.value === where.id)
    })
    return Promise.resolve({ errCode: 0, errMsg: 'ok', data: { key: 'share', value: where.id, doc: doc! } })
  }
}

export const documentService = new DocumentService()