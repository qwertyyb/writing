import { addAfter, remove, type BlockModel, type BlockOptions } from "@/models/block"
import { setCaretToEnd } from "@/models/caret"
import { nextTick, ref, type Ref } from "vue"
import CommandRenderer from "./commands/CommandRenderer.vue"

type Emits = ((evt: "add", args_0: {
  block: BlockModel;
  index: number;
  parent?: BlockModel | undefined;
}) => void) & ((evt: "update", args_0: {
  oldBlock: BlockModel;
  block: BlockModel;
  index: number;
  parent?: BlockModel | undefined;
}) => void) & ((evt: "remove", args_0: {
  block: BlockModel;
  index: number;
  parent?: BlockModel | undefined;
}) => void) & ((evt: "change", args_0: BlockModel) => void)

const useBlockOperate = (parent: Ref<BlockModel>, emits: Emits) => {
  const el = ref<HTMLElement>()
  const blockRefs = ref<InstanceType<typeof CommandRenderer>[]>([])

  const focusBlock = (id: string) => {
    setTimeout(() => {
      nextTick(() => {
        const input: HTMLDivElement | null | undefined = el.value?.querySelector(`[data-block-id=${JSON.stringify(id)}] [contenteditable]`)
        input?.focus()
        input && setCaretToEnd(input)
      })
    })
  }

  const emitUpdate = () => {
    nextTick(() => {
      emits('change', save())
    })
  }

  const addBlock = (options: Partial<BlockOptions> | undefined | null, block: BlockModel, index: number) => {
    const newBlock = addAfter(parent.value, {
      type: 'text',
      id: Math.random().toString(16).substring(2),
      ...options,
    }, index)
    focusBlock(newBlock.id)
    emits('add', {
      block,
      index: index + 1,
      parent: parent.value
    })
    emitUpdate()
  }

  const updateBlock = (options: Partial<BlockOptions>, block: BlockModel, index: number) => {
    const newBlock = addAfter(parent.value, {
      type: 'text',
      id: Math.random().toString(16).substring(2),
      ...options,
    }, index)
    remove(parent.value, block.id)
    focusBlock(newBlock.id)
    emits('update', { oldBlock: block, block: newBlock, index, parent: parent.value })
    emitUpdate()
  }

  const removeBlock = (block: BlockModel, index: number) => {
    remove(parent.value, block.id)
    focusBlock(parent.value.children![index - 1].id)
    emits('remove', {
      block,
      index,
      parent: parent.value
    })
    emitUpdate()
  }

  const save = () => {
    console.log(blockRefs.value.map(blockRef => blockRef.save()))
    return {
      ...parent.value,
      children: blockRefs.value.map(blockRef => blockRef.save())
    }
  }

  return { el, blockRefs, addBlock, updateBlock, removeBlock, save }
}

export default useBlockOperate
