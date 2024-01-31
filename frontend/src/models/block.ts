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

export interface BlockModel {
  type: string;
  id: string;
  children?: BlockModel[];
  data?: any;
}

export enum BlockEventName {
  Insert = 'insert',
  Push = 'push',
  Remove = 'remove',
  Update = 'update',
}

const add = (block: BlockModel, options: Partial<BlockOptions>, index?: number, position: 'before' | 'after' = 'after') => {
  if (!block.children) {
    block.children = []
  }
  if (typeof index === 'undefined' || index === null) {
    index = block.children.length - 1
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

export const addAfter = (block: BlockModel, options: Partial<BlockOptions>, index?: number) => {
  return add(block, options, index, 'after')
}

export const addBefore = (block: BlockModel, options: Partial<BlockOptions>, index?: number) => {
  return add(block, options, index, 'before')
}

export const update = (block: BlockModel, options: Partial<BlockOptions>) => {
  block.id = options.id ?? block.id
  block.type = options.type ?? block.type
  block.children = options.children ?? block.children
  block.data = options.data ?? block.data
  return block
}

export const remove = (parent: BlockModel, id: string) => {
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


