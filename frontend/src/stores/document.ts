import { service } from "@/services";
import { type IAttribute, type IDocument } from '@/services/types';
import { createLogger } from "@/utils/logger";
import type { NodeValue } from "@writing/editor";
import type { IWritingAttribute } from "@writing/types";
import { ElMessage, ElMessageBox } from "element-plus";
import { defineStore } from "pinia";

const logger = createLogger('document-store')

export type ListItem = Omit<IDocument, 'content'>

export interface IDocumentItem extends ListItem {
  children: IDocumentItem[]
}

export interface EditingDocument extends ListItem {
  content: NodeValue
}

const getRoot = (list: ListItem[]): ListItem | undefined => {
  return list.find(item => item.path === '')
}

const buildTree = (list: ListItem[], path: string, id: number | null): IDocumentItem[] => {
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

const getTreeNode = (tree: IDocumentItem, hoist: number): IDocumentItem | undefined => {
  if (tree.id === hoist) return tree;
  for(let i = 0; i < tree.children.length; i += 1) {
    const target = getTreeNode(tree.children[i], hoist)
    if (target) return target
  }
}

const createEditingDocument = (parentPath: string): Pick<EditingDocument, 'title' | 'path' | 'content'> & Partial<EditingDocument> => {
  return {
    title: '新文档',
    path: parentPath,
    nextId: null,
    attributes: [],
    content: {
      "type": "doc",
      "content": [
        {
          "type": "paragraph",
          "attrs": {
              "align": "left"
          },
        }
      ]
    }
  }
}

export const useDocumentStore = defineStore('document', {
  state: () => ({
    documents: [] as ListItem[],
    editing: null as (EditingDocument | null),
    hoistId: null as (number | null),
    expandedIdMap: {} as Record<number, boolean>
  }),
  getters: {
    tree(): IDocumentItem | null {
      const root = getRoot(this.documents)
      if (!root) return null
      const wholeTree = {
        ...root,
        children: buildTree(this.documents, `${root.path}/${root.id}`, null)
      }
      if (!this.hoistId) return wholeTree
      const hoistTree = getTreeNode(wholeTree, this.hoistId)
      return hoistTree ?? wholeTree
    }
  },
  actions: {
    async refresh() {
      const [
        { data: { list: documents } },
        hoistId
      ] = await Promise.all([
        service.documentService.findMany(),
        service.configService.getValue('hoist')
      ])
      this.documents = documents
      this.hoistId = hoistId ? Number(hoistId) : null
      this.expandAll()
    },
    hoist(node: IDocumentItem) {
      if (this.hoistId === node.id) {
        this.hoistId = null
      } else {
        this.hoistId = node.id
      }
      service.configService.setValue('hoist', this.hoistId ? this.hoistId.toString() : null)
    },
    moveToTarget(source: ListItem, target: ListItem, position: 'before' | 'after' | 'inside') {
      const updates: { id: number, path: string, nextId: number | null }[] = []
      if (position === 'after') {
        [target.nextId, source.nextId] = [source.id, target.nextId]
        source.path = target.path
        updates.push({ id: target.id, path: target.path, nextId: target.nextId })
      } else if (position === 'before') {
        const prev = this.documents.find(item => item.nextId === target.id)
        if (prev) {
          prev.nextId = source.id
          updates.push({ id: prev.id, path: prev.path, nextId: prev.nextId })
        }
        source.path = target.path
        source.nextId = target.id
      } else if (position === 'inside') {
        source.path = `${target.path}/${target.id}`
        const last = this.documents.find(item => item.path === source.path && item.nextId === null)
        if (last) {
          last.nextId = source.id
          source.nextId = null
          updates.push({ id: last.id, path: last.path, nextId: last.nextId })
        } else {
          source.nextId = null
        }
      }
      updates.push({ id: source.id, path: source.path, nextId: source.nextId })
      return updates
    },
    async move({ sourceId, toId, position }
      : {
        sourceIndexPath: number[], sourceId: number,
        toIndexPath: number[], toId: number,
        position: 'inside' | 'before' | 'after'
      }
    ) {
      logger.i('move', sourceId, toId, position)
      const updates: { id: number, path: string, nextId: number | null }[] = []

      const source = this.documents.find(item => item.id === sourceId)
      if (!source) return
      const sourcePrev = this.documents.find(item => item.path === source.path && item.nextId === source.id)
      const target = this.documents.find(item => item.id === toId)
      if (!target) return

      logger.i('move', position, { ...source }, {...target })
      if (!source) return

      // 把原位置的元素删除，即把前一个元素的下一个节点指向原位置的下一节点
      if (sourcePrev) {
        sourcePrev.nextId = source.nextId
        updates.push({ id: sourcePrev.id, path: sourcePrev.path, nextId: sourcePrev.nextId})
      }

      updates.push(...this.moveToTarget(source, target, position))

      logger.i('move', updates)
      // 调用接口更新
      await service.documentService.updateMany(updates)
    },
    async add(current: IDocumentItem, position: 'before' | 'after' | 'inside'): Promise<void> {
      logger.i('add', {...current}, position)
      const newDoc = createEditingDocument(current.path)
      const cur = this.documents.find(item => item.id === current.id)
      if (!cur) return
      const { data } = await service.documentService.add({
        ...newDoc,
        content: JSON.stringify(newDoc.content)
      })
      this.editing = {
        ...data,
        ...newDoc,
        attributes: []
      }
      const updates = this.moveToTarget(this.editing, cur, position)
      this.documents.push(this.editing)
      updates.length && await service.documentService.updateMany(updates)
    },
    async remove(node: IDocumentItem) {
      if (node.path === '') {
        ElMessage({ message: '根文档无法删除', type: 'error' })
        return
      }
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
      const prev = this.documents.find(item => item.nextId === node.id)
      logger.i('remove document', {...node}, {...prev})
      if (prev) {
        prev.nextId = node.nextId
      }
      const path = `${node.path}/${node.id}`
      await service.documentService.remove({ id: node.id })
      this.documents = this.documents.filter(item => {
        // 移除当前节点或者其子孙节点
        return item.id !== node.id && !item.path.startsWith(path)
      })
    },
    async activeEditing(id: number): Promise<void> {
      const { data: document } = await service.documentService.find({ id })
      this.editing = {
        ...document,
        content: JSON.parse(document.content)
      }
    },
    async updateEditingContent(content: NodeValue): Promise<void> {
      if (!this.editing) {
        throw new Error('没有正在编辑的文档')
      }
      await service.documentService.update({ id: this.editing.id, content: JSON.stringify(content) })
    },
    async updateEditingTitle(title: string): Promise<void> {
      if (!this.editing) {
        throw new Error('没有正在编辑的文档')
      }
      this.editing.title = title
      await service.documentService.update({ id: this.editing.id, title })
    },
    async updateAttributes(id: number, attributes: IWritingAttribute[]) {
      const { data } = await service.attributeService.setAttributes(id, attributes)
      const target = this.documents.find(item => item.id === id)
      if (!target) return
      const newAttributes = target.attributes.map(item => {
        const row = data.find(i => i.key === item.key)
        return row ?? item
      })
      data.forEach(row => {
        if (newAttributes.every(item => item.key !== row.key)) {
          newAttributes.push(row)
        }
      })
      target.attributes = newAttributes
      const isEditing = this.editing && (this.editing.id === id)
      if (isEditing) {
        this.editing!.attributes = newAttributes
      }
    },
    async removeAttributes(id: number, keys: string[]) {
      await service.attributeService.removeAttributes(id, keys)
      const target = this.documents.find(note => note.id === id)
      if (!target) return
      target.attributes = target.attributes.filter(attr => !keys.includes(attr.key))
      const isEditing = this.editing && (this.editing.id === id)
      if (isEditing) {
        this.editing!.attributes = target.attributes
      }
    },
    expandAll(expanded = true) {
      this.expandedIdMap = this.documents.reduce<Record<number, boolean>>((acc, doc) => {
        return {
          ...acc,
          [doc.id]: expanded
        }
      }, {})
    },
    toggleExpand(id: number, expanded?: boolean) {
      logger.i('toggleExpand', id)
      if (expanded === null || expanded === undefined) {
        this.expandedIdMap[id] = !this.expandedIdMap[id]
      } else {
        this.expandedIdMap[id] = expanded
      }
    }
  }
})