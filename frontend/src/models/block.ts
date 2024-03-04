import type { EditingDocument } from "@/stores/document";
import { createLogger } from "@/utils/logger";
import { equals } from "ramda";

const logger = createLogger('models/logger');

export interface BlockOptions {
  type: string;
  id: string;
  version?: number;
  children?: BlockModel[];
  data?: any;
}

export enum BlockSaveType {
  Raw = 'Raw',
  Data = 'Data',
}

export interface BlockModel<D extends any = any> {
  type: string;
  id: string;
  children: BlockModel[];
  data?: D;
}

export enum BlockEventName {
  Insert = 'insert',
  Push = 'push',
  Remove = 'remove',
  Update = 'update',
}

const addChild = (block: BlockModel, options: Partial<BlockOptions>, index?: number, position: 'before' | 'after' = 'after') => {
  if (!block.children) {
    block.children = []
  }
  if (typeof index === 'undefined' || index === null) {
    index = block.children.length
  }
  if (index < 0) {
    throw new Error('index 不能为负数')
  }
  if (index > block.children.length) {
    throw new Error('index 超出范围, length: ' + block.children.length)
  }
  const newBlock = createBlock(options)
  if (position === 'after') {
    block.children.splice(index + 1, 0, newBlock)
  } else if (position === 'before') {
    block.children.splice(index, 0, newBlock)
  }
  return newBlock
}

export const createBlockId = (): string => Math.random().toString(16).substring(2)

export const addChildAfter = (block: BlockModel, options: Partial<BlockOptions>, index?: number) => {
  return addChild(block, options, index, 'after')
}

export const addChildBefore = (block: BlockModel, options: Partial<BlockOptions>, index?: number) => {
  return addChild(block, options, index, 'before')
}

export const updateChild = (block: BlockModel, index: number, options: Partial<BlockOptions>) => {
  logger.i('update child', index, options)
  const child = block.children?.[index]
  if (!child) {
    logger.e('未找到子节点', block, index)
    throw new Error('未找到子节点')
  }
  block.children![index] = {
    ...child,
    ...options
  }
  logger.i('after update child', JSON.parse(JSON.stringify(block)))
  return block.children![index]
}

export const removeById = (parent: BlockModel, id: string) => {
  if (!parent.children) {
    throw new Error(`删除失败，该节点没有子节点`)
  }
  const index = parent.children.findIndex(block => block.id === id);
  if (index === -1) {
    throw new Error(`未找到待删除节点: ${id}`)
  }
  const blocks = parent.children.splice(index, 1)
  return blocks
}

export const remove = (parent: BlockModel, index: number) => {
  if (!parent.children) {
    throw new Error(`删除失败，该节点没有子节点`)
  }
  if (index < 0 || index > parent.children.length - 1) {
    throw new Error(`未找到待删除节点: ${index}`)
  }
  const blocks = parent.children.splice(index, 1)
  return blocks
}

export const createBlock = (options: Partial<BlockOptions>): BlockModel => {
  if (!options.id) {
    options.id = createBlockId()
  }
  if (!options.type) {
    options.type = 'text'
  }
  const block = {
    ...options,
    type: options.type ?? 'text',
    id: options.id ?? createBlockId(),
    children: options.children ?? []
  }
  return block
}

export const createEditingDocument = (parentPath: string): Pick<EditingDocument, 'title' | 'path' | 'content'> & Partial<EditingDocument> => {
  return {
    title: '新文档',
    path: parentPath,
    nextId: null,
    content: {
      id: createBlockId(),
      type: 'doc',
      data: {
        title: '新文档',
      },
      children: [
        {
          id: createBlockId(),
          type: 'text',
          data: {
            html: '',
          },
          children: []
        }
      ]
    }
  }
}

export const getBlockByPath = (root: BlockModel, path: number[]) => {
  // 路径上的第一个值恒为0，指root本身
  const [first, ...restPath] = path
  if (first !== 0) throw new Error('路径的第一个元素为根节点，应该恒为0')
  let node = root
  while(restPath.length) {
    const curIndex = restPath.shift()!
    if (node.children?.[curIndex]) {
      node = node.children[curIndex]
    } else {
      throw new Error(`路径${JSON.stringify(path)}不正确`)
    }
  }
  return node
}


export const getPrevPath = (
  root: BlockModel,
  path: number[],
  check: (block: BlockModel) => boolean = (() => true)
) => {
  if (!path || !root) return null

  const getMergablePathLast = (root: BlockModel, path: number[]): number[] | null => {
    const block = getBlockByPath(root, path)

    for(let i = (block.children?.length ?? 0) - 1; i >= 0; i -= 1) {
      const mergablePath = getMergablePathLast(root, [...path, i])
      if (mergablePath) return mergablePath
    }

    if (check(block)) {
      return path
    }
    return null
  }

  const prevPath = [...path]
  while(prevPath.length) {
    let prevPathIndex = prevPath.pop()! - 1
    while(prevPathIndex >= 0) {
      const prevBlock = getBlockByPath(root, [...prevPath, prevPathIndex])
      if (!prevBlock) break

      const mergablePath = getMergablePathLast(root, [...prevPath, prevPathIndex])
      if (mergablePath) {
        return mergablePath
      }

      prevPathIndex -= 1
    }
  }
  return null
}

export const getPrevMergablePath = (root: BlockModel, path: number[]) => getPrevPath(root, path, block => block.type === 'text')

export const walkTree = (
  prefixPath: number[],
  ancestor: BlockModel,
  callback: (path: number[], block: BlockModel) => void
) => {
  callback(prefixPath, ancestor)
  for(let i = 0; i < (ancestor.children?.length ?? 0); i+= 1) {
    walkTree(
      [...prefixPath, i],
      ancestor.children![i],
      callback
    )
  }
}

export const getCommonAncestorPath = (start: number[], end: number[]) => {
  let commonPath = start.length < end.length ? start.slice() : end.slice()
  for(let i = 0; i < Math.min(start.length, end.length); i+= 1) {
    if (start[i] !== end[i]) {
      commonPath = start.slice(0, i)
      break
    }
  }
  return commonPath
}

export const walkTreeBetween = (
  root: BlockModel,
  start: number[], end: number[],
  callback: (path: number[], block: BlockModel) => void
) => {
  const commonPath = getCommonAncestorPath(start, end)
  const ancestor = getBlockByPath(root, commonPath)
  let started = false
  let ended = true
  walkTree(commonPath, ancestor, (path, block) => {
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
