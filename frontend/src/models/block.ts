import type { EditingDocument } from "@/stores/document";
import { logger } from "@/utils/logger";
import EventEmitter from "events";

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
  children?: BlockModel[];
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
  const child = block.children?.[index]
  if (!child) {
    logger.e('未找到子节点', block, index)
    throw new Error('未找到子节点')
  }
  block.children![index] = {
    ...child,
    ...options
  }
  logger.i('after update child', block)
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
  }
  return block
}

export const createEditingDocument = (parent: { id: number | string, path: string }): Omit<EditingDocument, 'id' | 'updatedAt' | 'createdAt'> => {
  return {
    title: '新文档',
    path: `${parent.path}/${parent.id}`,
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

export interface BlockControllerModel {
  type: string;
  id: string;
  version?: number;
  children?: BlockController[];
  data?: any;
}

const createBlockController = (options: Partial<BlockControllerModel>) => {
  if (!options.id) {
    options.id = createBlockId()
  }
  if (!options.type) {
    options.type = 'text'
  }
  const model = {
    ...options,
    type: options.type ?? 'text',
    id: options.id ?? createBlockId(),
  }
  return new BlockController(model)
}

export class BlockController extends EventEmitter {
  private _model: BlockControllerModel
  get model() {
    return this._model
  }
  constructor(model: BlockControllerModel) {
    super()
    this._model = model
  }

  private add = (options: Partial<BlockControllerModel>, index?: number, position: 'before' | 'after' = 'after') => {
    if (!this._model.children) {
      this._model.children = []
    }
    if (typeof index === 'undefined' || index === null) {
      index = this._model.children.length
    }
    if (index < 0) {
      throw new Error('index 不能为负数')
    }
    if (index > this._model.children.length) {
      throw new Error('index 超出范围, length: ' + this._model.children.length)
    }
    const newBlockController = createBlockController(options)
    if (position === 'after') {
      this._model.children.splice(index + 1, 0, newBlockController)
    } else if (position === 'before') {
      this._model.children.splice(index, 0, newBlockController)
    }
    return newBlockController
  }

  emitUpdate = () => {
    this.emit('changed', this._model)
  }

  addAfter = (options: Partial<BlockControllerModel>, index?: number) => {
    const result = this.add(options, index, 'after')
    this.emit('added', { parent: this._model, index: (index || 0) + 1, block: result })
    this.emitUpdate()
    return result
  }

  addBefore = (options: Partial<BlockControllerModel>, index?: number) => {
    const result = this.add(options, index, 'before')
    this.emit('added', { parent: this._model, index: index || 0, block: result })
    this.emitUpdate()
    return result
  }

  removeByIndex = (index: number) => {
    if (!this._model.children) {
      throw new Error(`删除失败，该节点没有子节点`)
    }
    if (index < 0 || index > this._model.children.length - 1) {
      throw new Error(`未找到待删除节点: ${index}`)
    }
    const [removed] = this._model.children.splice(index, 1)
    this.emit('removed', {
      block: removed,
      index,
      parent: this._model
    })
    this.emitUpdate()
    return removed
  }

  update = (options: Partial<BlockControllerModel>) => {
    this._model = {
      ...this.model,
      ...options,
    }
    this.emit('updated', {
      block: this.model,
    })
    this.emitUpdate()
  }
}

export const createFromBlockModel = (model: BlockModel) => {
  const { children, ...restData } = model;
  const blockController = new BlockController(restData)
  if (Array.isArray(children)) {
    blockController.update({
      children: children.map(child => createFromBlockModel(child))
    })
  }
  return blockController
}


