import { addChildAfter, remove, type BlockModel, updateChild } from "@/models/block"
import { setCaretToEnd } from "@/models/caret"
import { inject, nextTick, ref, type ModelRef, type Ref } from "vue"
import { focusBefore } from "@/hooks/focus"
import { checkMove } from "@/hooks/move"
import { logger } from "@/utils/logger"

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
  removed: BlockModel;
  index: number;
  parent?: BlockModel | undefined;
}) => void) & ((evt: "change", args_0: BlockModel) => void) & ((evt: "update:modelValue", args_0: BlockModel) => void)

export const focusBlock = (el: HTMLElement | undefined | null, id: string) => {
  setTimeout(() => {
    nextTick(() => {
      const input: HTMLDivElement | null | undefined = (el || document.body).querySelector<HTMLDivElement>(`[data-block-id=${JSON.stringify(id)}] [data-focusable]`)
      input?.focus()
      logger.i('focusBlock', input, id)
      input && setCaretToEnd(input)
    })
  })
}

const useBlockOperate = (parent: Ref<BlockModel>, emits: Emits) => {
  const el = ref<HTMLElement>()

  const emitUpdate = () => {
    nextTick(() => {
      emits('change', parent.value)
      emits('update:modelValue', parent.value)
    })
  }

  const addBlock = (
    block: Partial<BlockModel> | undefined | null,
    index: number
  ) => {
    const newBlock = addChildAfter(parent.value, {
      type: 'text',
      id: Math.random().toString(16).substring(2),
      ...block,
    }, index)
    logger.i('addBlock', parent.value, index, newBlock)
    focusBlock(el.value, newBlock.id)
    emits('added', {
      block: newBlock,
      index: index + 1,
      parent: parent.value
    })
    emitUpdate()
  }

  const updateBlock = (index: number, data: Partial<BlockModel>, block: BlockModel) => {
    const oldKey = block.id + block.type
    const newBlock = updateChild(parent.value, index, data)
    if (oldKey !== newBlock.id + newBlock.type) {
      focusBlock(el.value, newBlock.id)
    }
    emits('updated', { oldBlock: block, block: newBlock, index, parent: parent.value })
    emitUpdate()
  }

  const removeBlock = (index: number, options = { autoFocusBefore: true }) => {
    const [removed] = remove(parent.value, index)
    logger.i('removeBlock', parent.value, index, removed)
    options.autoFocusBefore && focusBefore()
    emits('removed', {
      removed,
      index,
      parent: parent.value
    })
    emitUpdate()
    return removed
  }

  return { el, addBlock, updateBlock, removeBlock }
}

export default useBlockOperate

export const useMoveBlock = () => {
  const root = inject<ModelRef<BlockModel>>('root')
  const blockInstances = inject<Map<string, Omit<ReturnType<typeof useBlockOperate>, 'el'>>>('blockInstances')

  if (!blockInstances) {
    throw new Error('未获取到节点实例')
  }

  const move = (oldPath: number[], newPath: number[]) => {
    const { oldPathParent, oldIndex, newPathParent, newIndex } = checkMove(root!.value!, oldPath, newPath)
    logger.i('start move', { oldPath, oldPathParent }, { newPath, newPathParent })
    const oldIns = blockInstances.get(oldPathParent.id)
    const newIns = blockInstances.get(newPathParent.id)
    if (!oldIns || !newIns) {
      throw new Error('未获取节点实例')
    }
    logger.i('move old parent', oldIns, newIns)
    const removed = oldIns.removeBlock(oldIndex, { autoFocusBefore: false })
    newIns.addBlock(removed, newIndex)
  }

  return { move }
}