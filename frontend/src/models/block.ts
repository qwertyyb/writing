import { reactive } from "vue";

const VERSION = 1;

interface BlockOptions {
  type: string;
  id: string;
  version?: number;
  children?: Block[];
  content?: any;
}

enum BlockEventName {
  Insert = 'insert',
  Push = 'push',
  Remove = 'remove',
  Update = 'update',
}

// class BlockModel {
//   type: string;
//   id: string;
//   version: number = VERSION;
//   children: BlockModel[] = [];
//   content?: any;

//   constructor(options: BlockOptions) {
//     this.type = options.type;
//     this.id = options.id
//     this.version = options.version ?? VERSION;
//     this.children = options.children ?? [];
//     this.content = options.content ?? null;
//   }
// }

export class Block extends EventTarget {
  type: string;
  id: string;
  version: number = VERSION;
  children: Block[] = [];
  content?: any;

  constructor(options: BlockOptions) {
    super()
    this.type = options.type;
    this.id = options.id
    this.version = options.version ?? VERSION;
    this.children = reactive(options.children ?? []);
    this.content = options.content ?? null;
  }

  add = (options: BlockOptions, index?: number, position: 'before' | 'after' = 'after') => {
    if (typeof index === 'undefined' || index === null) {
      index = this.children.length - 1
    }
    if (index < 0) {
      throw new Error('index 不能为负数')
    }
    if (index > this.children.length - 1) {
      throw new Error('index 超出范围, length: ' + this.children.length)
    }
    const block = createBlock(options)
    if (position === 'after') {
      this.children.splice(index + 1, 0, block)
      this.dispatchEvent(new CustomEvent(BlockEventName.Push, { detail: block }))
    } else if (position === 'before') {
      this.children.splice(index, 0, block)
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
    const index = this.children.findIndex(block => block.id === id);
    if (index === -1) {
      throw new Error(`未找到待删除节点: ${id}`)
    }
    const blocks = this.children.splice(index, 1)
    this.dispatchEvent(new CustomEvent(BlockEventName.Remove, { detail: blocks }))
    return blocks
  }

  update = (options: BlockOptions) => {
    this.id = options.id ?? this.id
    this.type = options.type ?? this.type
    this.children = options.children ?? this.children
    this.content = options.content ?? this.content
    this.version = options.version ?? this.version
    this.dispatchEvent(new CustomEvent(BlockEventName.Update, { detail: this }))
  }

  query = (filter: Parameters<typeof Array.prototype.filter>[0] = () => true) => {
    return this.children.filter(filter)
  }
}

export const createBlock = (options: BlockOptions): Block => reactive(new Block(options))

