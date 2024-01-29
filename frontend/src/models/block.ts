import { ref, type Ref } from "vue";

const VERSION = 1;

interface BlockOptions {
  type: string;
  id: string;
  version?: number;
  children?: BlockModel[];
  content?: any;
}

enum BlockEventName {
  Insert = 'insert',
  Push = 'push',
  Remove = 'remove',
  Update = 'update',
}

export class BlockModel {
  type: string;
  id: string;
  version: number = VERSION;
  children: BlockModel[] = [];
  content?: any;

  constructor(options: BlockOptions) {
    this.type = options.type;
    this.id = options.id
    this.version = options.version ?? VERSION;
    this.children = options.children ?? [];
    this.content = options.content ?? null;
  }
}

export class BlockAction extends EventTarget {
  block: Ref<BlockModel>

  constructor(block: BlockModel) {
    super()
    this.block = ref(block)
  }

  private add = (options: BlockOptions, index?: number, position: 'before' | 'after' = 'after') => {
    if (typeof index === 'undefined' || index === null) {
      index = this.block.value.children.length - 1
    }
    if (index < 0) {
      throw new Error('index 不能为负数')
    }
    if (index > this.block.value.children.length - 1) {
      throw new Error('index 超出范围, length: ' + this.block.value.children.length)
    }
    const block = new BlockModel(options)
    if (position === 'after') {
      this.block.value.children.splice(index + 1, 0, block)
      this.dispatchEvent(new CustomEvent(BlockEventName.Push, { detail: block }))
    } else if (position === 'before') {
      this.block.value.children.splice(index, 0, block)
      this.dispatchEvent(new CustomEvent(BlockEventName.Insert, { detail: block }))
    }
    return block
  }

  insert = (options: BlockOptions, index?: number) => {
    return this.add(options, index, 'before')
  }

  push = (options: BlockOptions, index?: number) => {
    return this.add(options, index, 'after')
  }

  remove = (id: string) => {
    const index = this.block.value.children.findIndex(block => block.id === id);
    if (index === -1) {
      throw new Error(`未找到待删除节点: ${id}`)
    }
    const blocks = this.block.value.children.splice(index, 1)
    this.dispatchEvent(new CustomEvent(BlockEventName.Remove, { detail: blocks }))
    return blocks
  }

  update = (options: BlockOptions) => {
    this.block.value.id = options.id ?? this.block.value.id
    this.block.value.type = options.type ?? this.block.value.type
    this.block.value.children = options.children ?? this.block.value.children
    this.block.value.content = options.content ?? this.block.value.content
    this.block.value.version = options.version ?? this.block.value.version
    this.dispatchEvent(new CustomEvent(BlockEventName.Update, { detail: this }))
  }

  query = (filter: Parameters<typeof Array.prototype.filter>[0] = () => true) => {
    return this.block.value.children.filter(filter)
  }
}
