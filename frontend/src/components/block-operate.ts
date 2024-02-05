import { addAfter, remove, type BlockModel, type BlockOptions, update } from "@/models/block"
import { setCaretToEnd } from "@/models/caret"
import { nextTick, ref, type Ref } from "vue"
import type BlockEditor from "./BlockEditor.vue"
import { focusBefore } from "@/hooks/focus"

type Emits = ((evt: "added", args_0: {
  block: BlockModel;
  index: number;
  parent?: BlockModel | undefined;
}) => void) & ((evt: "updated", args_0: {
  oldBlock: BlockModel;
  block: BlockModel;
  index: number;
  parent?: BlockModel | undefined;
}) => void) & ((evt: "removed", args_0: {
  block: BlockModel;
  index: number;
  parent?: BlockModel | undefined;
}) => void) & ((evt: "change", args_0: BlockModel) => void) & ((evt: "update:modelValue", args_0: BlockModel) => void)

export const focusBlock = (el: HTMLElement | undefined | null, id: string) => {
  setTimeout(() => {
    nextTick(() => {
      const input: HTMLDivElement | null | undefined = (el || document.body).querySelector<HTMLDivElement>(`[data-block-id=${JSON.stringify(id)}] [data-focusable]`)
      input?.focus()
      input && setCaretToEnd(input)
    })
  })
}

const useBlockOperate = (parent: Ref<BlockModel>, emits: Emits) => {
  const el = ref<HTMLElement>()
  const blockRefs = ref<Record<string, InstanceType<typeof BlockEditor> | null>>({})

  const setBlockRef = (id: string, blockRef: InstanceType<typeof BlockEditor> | null) => {
    blockRefs.value![id] = blockRef
  }

  const emitUpdate = () => {
    nextTick(() => {
      emits('change', save())
      emits('update:modelValue', save())
    })
  }

  const addBlock = (options: Partial<BlockOptions> | undefined | null, block: BlockModel, index: number) => {
    const newBlock = addAfter(parent.value, {
      type: 'text',
      id: Math.random().toString(16).substring(2),
      ...options,
    }, index)
    focusBlock(el.value, newBlock.id)
    emits('added', {
      block,
      index: index + 1,
      parent: parent.value
    })
    emitUpdate()
  }

  const updateBlock = (options: Partial<BlockOptions>, block: BlockModel, index: number) => {
    const oldKey = block.id + block.type
    update(block, options)
    if (oldKey !== block.id + block.type) {
      focusBlock(el.value, block.id)
    }
    emits('updated', { oldBlock: block, block: block, index, parent: parent.value })
    emitUpdate()
  }

  const removeBlock = (block: BlockModel, index: number) => {
    const [removed] = remove(parent.value, block.id)
    focusBefore()
    emits('removed', {
      block,
      index,
      parent: parent.value
    })
    emitUpdate()
    return removed
  }

  // 增加层级，把前一个block作为父block, 当前节点作为前一个节点的子节点
  const increaseLevelBlock = (block: BlockModel, index: number) => {
    // 当前已经是第一个节点，无法降低层级
    if (index === 0) return
    const [ removed ] = remove(parent.value, block.id)
    addAfter(parent.value.children![index - 1], removed)
    emitUpdate()
    focusBlock(el.value, removed.id)
  }

  // 增加层级，把前一个block作为父block, 当前节点作为前一个节点的子节点
  const decreaseLevelBlock = (block: BlockModel, index: number) => {
    // 当前已经是第一个节点，无法降低层级
    if (index === 0) return
    const [ removed ] = remove(parent.value, block.id)
    addAfter(parent.value.children![index - 1], removed)
    emitUpdate()
  }

  const save = () => {
    return {
      ...parent.value,
      children: parent.value.children?.map(block => blockRefs.value[block.id]?.save()).filter(i => i)
    }
  }

  return { el, setBlockRef, addBlock, updateBlock, removeBlock, increaseLevelBlock, decreaseLevelBlock, save }
}

export default useBlockOperate
