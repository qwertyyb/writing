import { createEditingDocument, type BlockModel } from "@/models/block";
import { getList, type Document, getDocument, updateDocument, addDocument, removeDocument } from "@/services/document";
import { logger } from "@/utils/logger";
import { ElMessageBox } from "element-plus";
import { defineStore } from "pinia";

type ListItem = Omit<Document, 'content'>

export interface DocumentItem extends ListItem {
  children: DocumentItem[]
}

export interface EditingDocument extends ListItem {
  content: BlockModel
}

const getRoot = (list: ListItem[]): ListItem | undefined => {
  return list.find(item => item.path === '')
}

const buildTree = (node: ListItem, list: ListItem[]): DocumentItem => {
  return {
    ...node,
    children: list.reduce<DocumentItem[]>((arr, item) => {
      const isChild = item.path === `${node.path}/${node.id}`
      if (!isChild) return arr
      return [
        ...arr,
        buildTree(item, list)
      ]
    }, [])
  }
}

export const useDocumentStore = defineStore('document', {
  state: () => ({
    documents: [] as Omit<Document, 'content'>[],
    editing: null as (EditingDocument | null),
    expandedIdMap: {} as Record<number, boolean>
  }),
  getters: {
    tree(): DocumentItem | null {
      const root = getRoot(this.documents)
      if (!root) return null
      return buildTree(root, this.documents)
    }
  },
  actions: {
    async getList(): Promise<void> {
      const { data: { list: documents } } = await getList()
      this.documents = documents
      this.expandAll()
    },
    async addDocument(parent: DocumentItem): Promise<void> {
      const newDoc = createEditingDocument(parent)
      const { data } = await addDocument({
        ...newDoc,
        content: JSON.stringify(newDoc.content)
      })
      this.editing = {
        ...data,
        ...newDoc
      }
      this.documents.push(data)
    },
    async removeDocument(node: DocumentItem) {
      if (node.children.length) {
        await ElMessageBox.confirm(
          '删除此文档也将删除其子文档，是否确认删除？',
          'warning',
          {
            confirmButtonText: '删除',
            cancelButtonText: '取消',
            type: 'warning'
          }
        )
      }
      logger.i('remove document', node)
      const path = `${node.path}/${node.id}`
      await removeDocument({ path })
      this.documents = this.documents.filter(item => {
        // 移除当前节点或者其子孙节点
        return item.id !== node.id && !item.path.startsWith(path)
      })
    },
    async activeEditing(id: number): Promise<void> {
      const { data: document } = await getDocument({ id })
      this.editing = {
        ...document,
        content: JSON.parse(document.content) as BlockModel
      }
    },
    async updateEditingContent(content: BlockModel): Promise<void> {
      if (!this.editing) {
        throw new Error('没有正在编辑的文档')
      }
      const title = content.data?.title ?? this.editing?.title
      this.editing.title = title
      const doc = this.documents.find(item => item.id === this.editing!.id)
      if (doc) {
        doc.title = title
      }
      await updateDocument({ id: this.editing.id, title, content: JSON.stringify(content) })
    },
    async updateEditingTitle(title: string): Promise<void> {
      if (!this.editing) {
        throw new Error('没有正在编辑的文档')
      }
      this.editing.title = title
      this.editing.content.data = {
        ...this.editing.content.data,
        title
      }
      await updateDocument({ id: this.editing.id, title, content: JSON.stringify(this.editing.content) })
    },
    async updateEditingPath() {
      // @todo 
    },
    expandAll() {
      this.expandedIdMap = this.documents.reduce<Record<number, boolean>>((acc, doc) => {
        return {
          ...acc,
          [doc.id]: true
        }
      }, {})
    },
    toggleExpand(node: DocumentItem) {
      logger.i('toggleExpand', node)
      this.expandedIdMap[node.id] = !this.expandedIdMap[node.id]
    }
  }
})