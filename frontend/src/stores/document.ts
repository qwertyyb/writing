import { createEditingDocument, type BlockModel } from "@/models/block";
import { setAttributes, type Attribute } from "@/services/attribute";
import { getList, type Document, getDocument, updateDocument, addDocument, removeDocument, moveDocument } from "@/services/document";
import { createLogger } from "@/utils/logger";
import { ElMessageBox } from "element-plus";
import { defineStore } from "pinia";

const logger = createLogger('document-store')

type ListItem = Omit<Document, 'content' | 'attributes'>

export interface DocumentItem extends ListItem {
  children: DocumentItem[]
}

export interface EditingDocument extends Omit<Document, 'content'> {
  content: BlockModel
}

const getRoot = (list: ListItem[]): ListItem | undefined => {
  return list.find(item => item.path === '')
}

const buildTree = (list: ListItem[], path: string, id: number | null): DocumentItem[] => {
  const previousNode = list.find(item => item.path === path && item.nextId === id)
  if (!previousNode) return []
  return [
    ...buildTree(list, path, previousNode.id),
    {
      ...previousNode,
      children: buildTree(list, `${previousNode.path}/${previousNode.id}`, null)
    }
  ]
}

const getNodeFromIndexPath = (node: DocumentItem, path: number[]): DocumentItem => {
  const index = path.shift()
  if (index || index === 0) {
    return getNodeFromIndexPath(node.children[index], path)
  }
  return node
}

export const useDocumentStore = defineStore('document', {
  state: () => ({
    documents: [] as ListItem[],
    editing: null as (EditingDocument | null),
    expandedIdMap: {} as Record<number, boolean>
  }),
  getters: {
    tree(): DocumentItem | null {
      const root = getRoot(this.documents)
      if (!root) return null
      return {
        ...root,
        children: buildTree(this.documents, `${root.path}/${root.id}`, null)
      }
    }
  },
  actions: {
    async getList(): Promise<void> {
      const { data: { list: documents } } = await getList()
      this.documents = documents
      this.expandAll()
    },
    async move(options: { fromId: number, fromIndexPath: number[], toId: number, toIndexPath: number[], itemId: number, oldIndex: number, newIndex: number }) {
      logger.i('move', options)
      // @todo 调用接口调整顺序
      const updates: { id: number, path: string, nextId: number | null }[] = []

      const item = this.documents.find(item => item.id === options.itemId)
      if (!item) return
      const fromNode = this.documents.find(item => item.id === options.fromId)
      const toNode = this.documents.find(item => item.id === options.toId)
      if (!fromNode || !toNode || !this.tree) return
      // 修改原index位置的nextId
      const fromTreeNode = getNodeFromIndexPath(this.tree, [...options.fromIndexPath])
      logger.i('move remove node', fromTreeNode, options.oldIndex, fromTreeNode.children[options.oldIndex - 1])
      // 当前位于第一个位置时，无须更新前一个节点，否则需要更新前一个节点
      const fromPrevNode = options.oldIndex > 0 ? this.documents.find(item => item.id === fromTreeNode.children[options.oldIndex - 1].id) : null
      // 先从fromNode中移除此子节点
      if (fromPrevNode) {
        fromPrevNode!.nextId = item.nextId
        updates.push({ id: fromPrevNode.id, path: fromPrevNode.path, nextId: fromPrevNode.nextId })
      }
      item.path = 'xxxx'

      const toTreeNode = getNodeFromIndexPath(this.tree, [...options.toIndexPath])
      logger.i('move add node', toTreeNode, options.newIndex, toTreeNode.children[options.newIndex - 1])
      const newPrevNode = options.newIndex > 0 ? this.documents.find(item => item.id === toTreeNode.children[options.newIndex - 1].id) : null
      logger.i('prevNode', newPrevNode, toTreeNode.children)
      const originNextId = newPrevNode ? newPrevNode.nextId : toTreeNode.children[0]?.id ?? null
      item.path = `${toTreeNode.path}/${toTreeNode.id}`
      item.nextId = originNextId
      updates.push({ id: item.id, path: item.path, nextId: item.nextId })
      if (newPrevNode) {
        newPrevNode.nextId = item.id
        updates.push({ id: newPrevNode.id, path: newPrevNode.path, nextId: newPrevNode.nextId })
      }
      logger.i('updates backend', updates)
      await moveDocument(updates)
    },
    async addDocument(parent: DocumentItem): Promise<void> {
      const newDoc = createEditingDocument(parent)
      const { data } = await addDocument({
        ...newDoc,
        content: JSON.stringify(newDoc.content)
      })
      this.editing = {
        ...data,
        ...newDoc,
        attributes: []
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
      } else {
        await ElMessageBox.confirm(
          '确认删除此文档，可在回收站恢复？',
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
    async updateAttributes(attributes: Attribute[]) {
      if (!this.editing) return
      const { data } = await setAttributes(this.editing.id, attributes)
      const newAttributes = this.editing.attributes.map(item => {
        const row = data.find(item => item.key === item.key)
        return row ?? item
      })
      data.forEach(row => {
        if (newAttributes.every(item => item.key !== row.key)) {
          newAttributes.push(row)
        }
      })
      this.editing.attributes = newAttributes
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