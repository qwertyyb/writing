import { createLogger } from "@/utils/logger"
import { equals } from "ramda"
import EventEmitter from 'eventemitter3'

const logger = createLogger('BlockTree')

interface BlockTreeData extends Event {
  type: string
  id: string
  children: (BlockTreeData | BlockTree)[],
  data: any
}

export const createId = (): string => Math.random().toString(16).substring(2)

const createBlockTreeData = (data: Partial<BlockTreeData>) => {
  const newData = { ...data }
  if (!data.id) {
    newData.id = createId()
  }
  if (!data.type) {
    newData.type = 'text'
  }
  return {
    id: createId(),
    type: 'text',
    children: [],
    ...newData
  }
}

export class BlockTree extends EventEmitter {
  type: string
  id: string
  data: any
  children: BlockTree[] = []
  parent: BlockTree | null = null
  constructor(options: Partial<BlockTreeData>) {
    super()
    const value = createBlockTreeData(options)
    this.type = value.type
    this.id = value.id
    this.data = value.data
    this.children = value.children.map((item: any) => {
      return BlockTree.fromJSON(item)
    })
  }

  update(data: Partial<BlockTreeData>) {
    this.type = data.type ?? this.type
    this.id = data.id ?? this.id
    this.data = data.data ?? this.data
    this.children = data.children?.map(item => BlockTree.fromJSON(item)) ?? this.children
  }

  addChildAfter(options: Partial<BlockTreeData>, index: number) {
    if (typeof index === 'undefined' || index === null) {
      index = this.children.length
    }
    if (index < 0) {
      throw new Error('index 不能为负数')
    }
    if (index > this.children.length) {
      throw new Error('index 超出范围, length: ' + this.children.length)
    }
    const newBlockTree = BlockTree.fromJSON(options)
    this.children.splice(index + 1, 0, newBlockTree)
    this.emit('child-added', { index: index + 1, block: newBlockTree })
    return newBlockTree
  }

  updateChild(index: number, options: Partial<BlockTreeData>) {
    logger.i('update child', index, options)
    const child = this.children?.[index]
    if (!child) {
      logger.e('未找到子节点', this, index)
      throw new Error('未找到子节点')
    }
    this.children![index].update(options)
    logger.i('after update child', JSON.parse(JSON.stringify(this)))
    this.emit('child-updated', { index, block: this.children![index] })
    return this.children![index]
  }

  removeChild = (index: number) => {
    if (!this.children.length) {
      throw new Error(`删除失败，该节点没有子节点`)
    }
    if (index < 0 || index > this.children.length - 1) {
      throw new Error(`未找到待删除节点: ${index}`)
    }
    const [block] = this.children.splice(index, 1)
    this.emit('child-removed', { index, block })
    return block
  }

  static fromJSON(model: any): BlockTree {
    if (model instanceof BlockTree) return model
    const children = model.children.map((item: any) => {
      return BlockTree.fromJSON(item)
    })
    const instance = new BlockTree({
      ...model,
      children
    })
    return instance
  }
  static getByPath = (root: BlockTree, path: number[]) => {
    // 路径上的第一个值恒为0，指root本身
    let node: BlockTree = root
    const restPath = [...path]
    while(restPath.length) {
      const curIndex = restPath.shift()!
      if (node.children[curIndex]) {
        node = node.children[curIndex]
      } else {
        throw new Error(`路径${JSON.stringify(path)}不正确`)
      }
    }
    return node
  }

  static walkTree = (
    prefixPath: number[],
    ancestor: BlockTree,
    callback: (path: number[], block: BlockTree) => void
  ) => {
    callback(prefixPath, ancestor)
    for(let i = 0; i < (ancestor.children?.length ?? 0); i+= 1) {
      BlockTree.walkTree(
        [...prefixPath, i],
        ancestor.children![i],
        callback
      )
    }
  }

  static getCommonAncestorPath = (start: number[], end: number[]) => {
    let commonPath = start.length < end.length ? start.slice() : end.slice()
    for(let i = 0; i < Math.min(start.length, end.length); i+= 1) {
      if (start[i] !== end[i]) {
        commonPath = start.slice(0, i)
        break
      }
    }
    return commonPath
  }

  static walkTreeBetween = (
    root: BlockTree,
    start: number[], end: number[],
    callback: (path: number[], block: BlockTree) => void
  ) => {
    const commonPath = BlockTree.getCommonAncestorPath(start, end)
    const ancestor = BlockTree.getByPath(root, commonPath)
    let started = false
    let ended = true
    BlockTree.walkTree(commonPath, ancestor, (path, block) => {
      if (started && !ended && equals(end, path)) {
        callback(path, block)
        ended = true
      }
      if (started && !ended) {
        callback(path, block)
      }
      if (equals(start, path)) {
        callback(path, block)
        started = true
        ended = equals(end, path)
      }
    })
  }

  getByPath = (path: number[]) => {
    return BlockTree.getByPath(this, path)
  }

  walkPrevFromPath = (
    path: number[],
    predicate: (path: number[], block: BlockTree) => boolean = (() => true)
  ) => {
    if (!path.length) return null
  
    const getMergablePathLast = (root: BlockTree, path: number[]): number[] | null => {
      const block = BlockTree.getByPath(root, path)
  
      for(let i = (block.children?.length ?? 0) - 1; i >= 0; i -= 1) {
        const mergablePath = getMergablePathLast(root, [...path, i])
        if (mergablePath) return mergablePath
      }
  
      if (predicate(path, block)) {
        return path
      }
      return null
    }
  
    const prevPath = [...path]
    while(prevPath.length) {
      let prevPathIndex = prevPath.pop()! - 1
      while(prevPathIndex >= 0) {
        const prevBlock = this.getByPath([...prevPath, prevPathIndex])
        if (!prevBlock) break
  
        const mergablePath = getMergablePathLast(this, [...prevPath, prevPathIndex])
        if (mergablePath) {
          return mergablePath
        }
  
        prevPathIndex -= 1
      }
    }
    return null
  }

  toJSON(): any {
    return {
      type: this.type,
      id: this.id,
      children: this.children.map(item => item.toJSON()),
      data: this.data
    }
  }
}