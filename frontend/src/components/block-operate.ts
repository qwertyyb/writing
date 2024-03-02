import { remove, type BlockModel, updateChild, addChildBefore, addChildAfter } from "@/models/block"
import { moveCaret, moveCaretToEnd, moveCaretToStart } from "@/models/caret"
import { inject, nextTick, ref, type ModelRef, type Ref } from "vue"
import { focusBefore } from "@/hooks/focus"
import { checkMove, getBlockByPath } from "@/hooks/move"
import { createLogger } from "@/utils/logger"

const logger = createLogger('block-operate')

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

const focusBlockImmediate = (el: HTMLElement | undefined | null, id: string, pos: 'start' | 'end') => {
  const input: HTMLDivElement | null | undefined = (el || document.body).querySelector<HTMLDivElement>(`[data-block-id=${JSON.stringify(id)}] [data-focusable]`)
  input?.focus()
  logger.i('focusBlock', input, id)
  input && (pos === 'end' && moveCaretToEnd(input) || pos === 'start' && moveCaretToStart(input))
}

export const focusBlock = (el: HTMLElement | undefined | null, id: string, pos: 'start' | 'end' = 'end') => {
  setTimeout(() => {
    nextTick(() => {
      focusBlockImmediate(el, id, pos)
    })
  })
}

const useBlockOperate = (parent: Ref<BlockModel>, path: number[], emits: Emits) => {
  const el = ref<HTMLElement>()

  const emitUpdate = () => {
    nextTick(() => {
      emits('change', parent.value)
      emits('update:modelValue', parent.value)
    })
  }

  const addBlock = (
    data: Partial<BlockModel> | undefined | null,
    index: number,
    block: BlockModel | null = null,
  ) => {
    const blockData = {
      type: 'text',
      id: Math.random().toString(16).substring(2),
      ...data,
      children: block?.children ?? [],
    }

    const blockPath = [...path, index]

    const patch = { op: 'add', path: blockPath, blockData }
    logger.i('addBlock patch', path, patch)

    const newBlock = addChildAfter(parent.value, {
      type: 'text',
      id: Math.random().toString(16).substring(2),
      ...data,
      children: block?.children ?? [],
    }, index)
    logger.i('addBlock', parent.value, index, newBlock)
    focusBlock(el.value, newBlock.id, 'start')
    if (block) {
      updateBlock(index, { children: [] }, block)
    }
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

  const removeBlock = (index: number, path: number[], options = { autoFocusBefore: true }) => {
    if (path.length === 2 && index === 0) {
      // 不可删除文档的第一个节点
      return
    }
    const [removed] = remove(parent.value, index)
    logger.i('removeBlock', parent.value, index, removed)
    if (options.autoFocusBefore) {
      focusBefore()
      logger.i('removeBlock focus', document.activeElement)
      moveCaretToEnd(document.activeElement! as HTMLElement)
    }
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
    const removed = oldIns.removeBlock(oldIndex, oldPath, { autoFocusBefore: false })
    newIns.addBlock(removed, newIndex)
  }

  return { move }
}

export const useMergeBlock = () => {
  const root = inject<ModelRef<BlockModel>>('root')
  const blockInstances = inject<Map<string, Omit<ReturnType<typeof useBlockOperate>, 'el'>>>('blockInstances')

  if (!blockInstances) {
    throw new Error('未获取到节点实例')
  }

  const merge = (originPath: number[], mergePath: number[]) => {
    const originParent = getBlockByPath(root!.value, [...originPath.slice(0, originPath.length - 1)])
    const origin = getBlockByPath(root!.value, originPath)
    const mergeBlock = getBlockByPath(root!.value, mergePath)
    logger.i('merge', originPath, originParent, origin, mergePath, mergeBlock)
    
    const offset = mergeBlock.data.html.length

    mergeBlock.data.html += origin.data.html
    blockInstances.get(originParent.id)?.removeBlock(originPath[originPath.length - 1], originPath, { autoFocusBefore: false })
    setTimeout(() => {
      moveCaret(document.body.querySelector<HTMLDivElement>(`[data-block-id=${JSON.stringify(mergeBlock.id)}] [data-focusable]`)!, offset)
    })
  }

  return { merge }
}
