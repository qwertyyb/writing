import type { Low } from "lowdb";
import type { IDocument, IDocumentService, ResponseData } from "../types";
import type { Database, IFileServer } from "./base";

const DOC_DIR_PATH = 'posts'

export class DocumentService implements IDocumentService {
  constructor(private fsServer: IFileServer, private low: Low<Database>) {
    this.insertRootIfNotExist()
  }

  private insertRootIfNotExist = async () => {
    await this.low.read()
    const row = this.low.data.document.find(i => i.path === '')
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
    const doc = {
      id: 1,
      title: 'root',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      nextId: null,
      attributes: [],
      content: '',
      path: '',
    }
    await this.fsServer.writeJSON({ ...doc, content }, `${DOC_DIR_PATH}/1.json`)
    await this.low.update(meta => {
      meta.document.push(doc)
    })
  }


  async find(where: { id: number }) {
    await this.low.read()
    const document = await this.fsServer.readJSON(`${DOC_DIR_PATH}/${where.id}.json`)
    return Promise.resolve({ errMsg: 'ok', errCode: 0, data: document })
  }
  findMany = async () => {
    await this.low.read()
    const list = this.low.data.document
    return Promise.resolve({ errCode: 0, errMsg: 'ok', data: { total: list.length, list } })
  }
  update = async (data: Pick<IDocument, "id"> & Partial<Pick<IDocument, "title" | "content">>) => {
    const { id, content, ...rest } = data
    let target: IDocument | null = null
    await this.low.update(({ document }) => {
      const index = document.findIndex(item => item.id === id)
      if (index >= 0) {
        document[index] = { ...document[index], ...rest }
        target = document[index]
      }
    })
    if (target) {
      await this.fsServer.writeJSON({ ...(target as IDocument), content }, `${DOC_DIR_PATH}/${id}.json`)
    }
    return { errCode: 0, errMsg: 'ok', data: {} }
  }
  updateMany = async (data: { id: number; path: string; nextId: number | null; }[]) => {
    await this.low.update((meta) => {
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
    await this.low.update(meta => {
      meta.document = meta.document.filter(item => item.id !== where.id)
    })
    return { errCode: 0, errMsg: 'ok', data: null }
  };
  add = async (data: Pick<IDocument, "title" | "content" | "path">): Promise<ResponseData<Omit<IDocument, "content">>> => {
    let doc: IDocument | null = null
    const { content, ...rest } = data
    await this.low.update(meta => {
      const maxId = Math.max(...meta.document.map(item => item.id)) || 0
      const nextId = maxId + 1
      doc = {
        id: nextId, ...rest, content: '', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
        nextId: null,
        attributes: []
      }
      meta.document.push(doc)
    })
    if (doc) {
      await this.fsServer.writeJSON({ ...(doc as IDocument), content }, `${DOC_DIR_PATH}/${doc!.id}.json`)
    }
    return { errCode: 0, errMsg: 'ok', data: doc! }
  };
  findByShareId = async (where: { id: string; }): Promise<ResponseData<{ key: string; value: string; doc: IDocument; }>> => {
    await this.low.read()
    const doc = this.low.data.document.find(doc => {
      return doc.attributes.some(attr => attr.key === 'share' && attr.value === where.id)
    })
    const file = await this.fsServer.readFile(`${DOC_DIR_PATH}/${doc!.id}.json`)
    return Promise.resolve({ errCode: 0, errMsg: 'ok', data: { key: 'share', value: where.id, doc: { ...doc!, content: (await file?.text() ?? '') } } })
  }
}
