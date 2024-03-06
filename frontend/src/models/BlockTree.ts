import { createLogger } from "@/utils/logger"
import * as R from "ramda"
import EventEmitter from 'eventemitter3'
import { createBlock, type BlockModel } from "./block"
import { PatchGenerator } from "@/utils/patch"
import { toRaw } from "vue"

const logger = createLogger('BlockTree')

export const rootSymbol = Symbol('root')

export class BlockTree extends EventEmitter {
  private _model: BlockModel
  get model(): BlockModel {
    return this._model
  }
  private pg: PatchGenerator = new PatchGenerator()
  constructor(model: BlockModel) {
    super()
    this._model = model
  }

  private getParentFromPath(path: number[]) {
    const parentPath = R.take(path.length - 1, path)
    const parent = this.getByPath(parentPath)
    return parent
  }

  private emitChange() {
    this.emit('change', this.model, this.pg.patches)
    this.pg.clear()
  }

  updateModel(model: BlockModel) {
    this._model = model
  }

  startTransaction<T extends (...args: any) => any>(updater: T): ReturnType<T> {
    const result = updater()
    this.emitChange()
    return result
  }

  addAfter(path: number[], data: Partial<BlockModel>) {
    const index = R.last(path)!
    const parent = this.getParentFromPath(path)

    if (index > parent.children.length) {
      logger.e('index out range', index, [...path], parent, this.model)
      throw new Error('index 超出范围, length: ' + parent.children.length)
    }

    const newBlock = createBlock(data)
    parent.children.splice(index + 1, 0, newBlock)
    
    const newPath = [...R.take(path.length - 1, path), index + 1]
    this.pg.add(newPath, newBlock)

    this.emit('added', { path: newPath, block: newBlock })
    return newBlock
  }

  update(path: number[], data: Partial<BlockModel>) {
    const index = R.last(path)!
    const parent = this.getParentFromPath(path)

    logger.i('update', [...path], data)
    const child = parent.children[index]
    if (!child) {
      logger.e('未找到子节点', toRaw(parent), [...path])
      throw new Error('未找到子节点')
    }
    const oldBlock = { ...child }
    parent.children[index] = {
      ...child,
      ...data
    }

    this.pg.replace(path, parent.children[index])

    this.emit('updated', { path, oldBlock, block: parent.children[index] })
    return parent.children[index]
  }

  remove = (path: number[]) => {
    const index = R.last(path)!
    const parent = this.getParentFromPath(path)

    if (!parent.children.length) {
      throw new Error(`删除失败，该节点没有子节点`)
    }
    if (index < 0 || index > parent.children.length - 1) {
      throw new Error(`未找到待删除节点: ${index}`)
    }

    const [block] = parent.children.splice(index, 1)

    this.pg.remove(path)
  
    this.emit('removed', { path, block })
    return block
  }

  static getByPath = (root: BlockModel, path: number[]) => {
    let node: BlockModel = root
    const restPath = [...path]
    while(restPath.length) {
      if (!node) {
        throw new Error(`路径${JSON.stringify(path)}不正确`)
      }
      const curIndex = restPath.shift()!
      node = node.children[curIndex]
    }
    return node
  }

  static walkTree = (
    prefixPath: number[],
    ancestor: BlockModel,
    callback: (path: number[], block: BlockModel) => void
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
    root: BlockModel,
    start: number[], end: number[],
    callback: (path: number[], block: BlockModel) => void
  ) => {
    const commonPath = BlockTree.getCommonAncestorPath(start, end)
    const ancestor = BlockTree.getByPath(root, commonPath)
    let started = false
    let ended = true
    BlockTree.walkTree(commonPath, ancestor, (path, block) => {
      if (started && !ended && R.equals(end, path)) {
        callback(path, block)
        ended = true
      }
      if (started && !ended) {
        callback(path, block)
      }
      if (R.equals(start, path)) {
        callback(path, block)
        started = true
        ended = R.equals(end, path)
      }
    })
  }

  getByPath = (path: number[]) => {
    return BlockTree.getByPath(this.model, path)
  }

  walkTreeBetween = (from: number[], to: number[], callback: (path: number[], block: BlockModel) => void) => {
    return BlockTree.walkTreeBetween(this.model, from, to, callback)
  }

  getPrev = (
    path: number[],
    predicate: (path: number[], block: BlockModel) => boolean = (() => true)
  ) => {
    if (!path.length) return null
  
    const getMergablePathLast = (root: BlockModel, path: number[]): {
      path: number[],
      block: BlockModel
    } | null => {
      const block = BlockTree.getByPath(root, path)
  
      for(let i = (block.children?.length ?? 0) - 1; i >= 0; i -= 1) {
        const mergablePath = getMergablePathLast(root, [...path, i])
        if (mergablePath) return mergablePath
      }
  
      if (predicate(path, block)) {
        return { path, block }
      }
      return null
    }
  
    const prevPath = [...path]
    while(prevPath.length) {
      let prevPathIndex = prevPath.pop()! - 1
      while(prevPathIndex >= 0) {
        const prevBlock = this.getByPath([...prevPath, prevPathIndex])
        if (!prevBlock) break
  
        const mergable = getMergablePathLast(this.model, [...prevPath, prevPathIndex])
        if (mergable) {
          return mergable
        }
  
        prevPathIndex -= 1
      }
    }
    return null
  }
}