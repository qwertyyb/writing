import type { Block, BlockOptions } from "@/models/block"
import { setCaretToEnd } from "@/models/caret"
import { nextTick, ref, type Ref } from "vue"
import CommandRenderer from "./commands/CommandRenderer.vue"

const useBlockOperate = (parent: Ref<Block>) => {
  const el = ref<HTMLElement>()
  const blockRefs = ref<InstanceType<typeof CommandRenderer>[]>([])

  const focusBlock = (id: string) => {
    nextTick(() => {
      const input: HTMLDivElement | null | undefined = el.value?.querySelector(`[data-block-id=${JSON.stringify(id)}] [contenteditable]`)
      input?.focus()
      input && setCaretToEnd(input)
    })
  }

  const addBlock = (options: Partial<BlockOptions> | undefined | null, block: Block, index: number) => {
    const newBlock = parent.value.push({
      type: 'text',
      id: Math.random().toString(16).substring(2),
      ...options,
    }, index)
    focusBlock(newBlock.id)
  }

  const updateBlock = (options: Partial<BlockOptions>, block: Block, index: number) => {
    const newBlock = parent.value.push({
      type: 'text',
      id: Math.random().toString(16).substring(2),
      ...options,
    }, index)
  parent.value.remove(block.id)
  focusBlock(newBlock.id)
  }

  const removeBlock = (block: Block, index: number) => {
    parent.value.remove(block.id)
    focusBlock(parent.value.children[index - 1].id)
  }

  const save = () => {
    return {
      ...parent.value,
      children: blockRefs.value.map(blockRef => blockRef.save())
    }
  }

  return { el, blockRefs, addBlock, updateBlock, removeBlock, save }
}

export default useBlockOperate
