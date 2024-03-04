import { remove, type BlockModel, updateChild, addChildAfter, getPrevPath } from "@/models/block"
import { moveCaret, moveCaretToEnd, moveCaretToStart } from "@/models/caret"
import { inject, nextTick, ref, type ModelRef, type Ref } from "vue"
import { focusBefore } from "@/hooks/focus"
import { checkMove, getBlockByPath } from "@/hooks/move"
import { createLogger } from "@/utils/logger"
import { PatchGenerator } from "@/utils/patch"
import { last } from 'ramda'
import { concat } from "@/models/delta"

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
}) => void) & ((evt: "change", args_0: BlockModel, changes: any[]) => void) & ((evt: "update:modelValue", args_0: BlockModel) => void)

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

const useBlockOperate = (parent: Ref<BlockModel>, emits: Emits) => {
  const el = ref<HTMLElement>()
  const root = inject<ModelRef<BlockModel>>('root')
  const blockInstances = inject<Map<string, Omit<ReturnType<typeof useBlockOperate>, 'el'>>>('blockInstances')

  const emitUpdate = (patches: any[]) => {
    emits('change', parent.value, patches)
    emits('update:modelValue', parent.value)
  }

  const addBlock = (
    data: Partial<BlockModel> | undefined | null,
    index: number,
    from: BlockModel | null = null,
  ) => {
    const pg = new PatchGenerator()

    const blockData = {
      type: 'text',
      id: Math.random().toString(16).substring(2),
      ...data,
      children: data?.children ?? from?.children ?? [],
    }

    pg.add(['children', index + 1], { ...blockData })
    const newBlock = addChildAfter(parent.value, blockData, index)
    if (from) {
      pg.replace(['children', index, 'children'], [])
      updateBlock(index, { children: [] }, from)
    }
    focusBlock(el.value, newBlock.id, 'start')
    emits('added', {
      block: newBlock,
      index: index + 1,
      parent: parent.value
    })
    emitUpdate(pg.patches)
    logger.i('addBlock patch', pg.patches)
  }

  const updateBlock = (index: number, data: Partial<BlockModel>, block: BlockModel) => {
    logger.i('updateBlock before', JSON.parse(JSON.stringify(root!.value)), JSON.parse(JSON.stringify(parent!.value)))
    const pg = new PatchGenerator()
    pg.replace(['children', index], data)
    const oldKey = block.id + block.type
    const newBlock = updateChild(parent.value, index, data)
    if (oldKey !== newBlock.id + newBlock.type) {
      focusBlock(el.value, newBlock.id)
    }
    emits('updated', { oldBlock: block, block: newBlock, index, parent: parent.value })
    emitUpdate(pg.patches)
    logger.i('updateBlock after', pg.patches, JSON.parse(JSON.stringify(root!.value)))
  }

  const removeBlock = (
    index: number,
    path: number[],
    options = { autoFocusBefore: true, moveChildrenToPrev: true }
  ) => {
    if (path.length === 2 && index === 0) {
      // 不可删除文档的第一个节点
      return
    }
    logger.i('removeBlock, path:', JSON.parse(JSON.stringify(path)), 'index:', index, JSON.parse(JSON.stringify(parent.value)))
    const pg = new PatchGenerator()
    pg.remove(['children', index])

    const [removed] = remove(parent.value, index)
    logger.i('removeBlock', parent.value, index, removed)

    if (options.moveChildrenToPrev) {
      const prevPath = getPrevPath(root!.value, path)!
      const prevParentPath = prevPath.slice(0, prevPath.length - 1)
      const prevParent = getBlockByPath(root!.value, prevParentPath)
      const prev = prevParent.children![prevPath[prevPath.length - 1]]
      blockInstances?.get(prevParent.id)?.updateBlock(
        prevPath[prevPath.length - 1],
        {
          children: [
            ...prev.children || [],
            ...removed.children || []
          ]
        },
        getBlockByPath(root!.value, prevPath)
      )
      logger.i('removeBlock, prevPath:', prevPath, getBlockByPath(root!.value, prevPath!))
    }

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
    emitUpdate(pg.patches)
    logger.i('removeBlock', pg.patches)
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
    logger.i('move, path:', { oldPath, oldPathParent }, { newPath, newPathParent })
    const oldIns = blockInstances.get(oldPathParent.id)
    const newIns = blockInstances.get(newPathParent.id)
    if (!oldIns || !newIns) {
      throw new Error('未获取节点实例')
    }
    const removed = oldIns.removeBlock(oldIndex, oldPath, { autoFocusBefore: false, moveChildrenToPrev: false })
    logger.i('move, removed: ', JSON.parse(JSON.stringify(removed)))
    newIns.addBlock(removed, newIndex)
  }

  const moveUpper = (path: number[]) => {
    if (!path || path.length <= 2) return false
    const newPosParent = getBlockByPath(root!.value, path.slice(0, path.length - 2))
    const newPosIndex = path[path.length - 2]
    const oldParent = newPosParent.children![newPosIndex]
    const oldIndex = path[path.length - 1]
    const oldBlock = oldParent.children![oldIndex]
    const afterChildren = oldParent.children!.slice(oldIndex + 1)
    logger.i('moveUpper', oldParent, oldIndex, newPosParent)
    blockInstances.get(newPosParent.id)?.updateBlock(newPosIndex, {
      children: oldParent.children?.slice(0, oldIndex) || []
    }, newPosParent.children![newPosIndex])
    blockInstances.get(newPosParent.id)?.addBlock(
      {
        ...oldBlock,
        children: [
          ...oldBlock.children || [],
          ...afterChildren
        ]
      },
      path[path.length - 2]
    )
  }

  const moveLower = (path: number[]) => {
    const index = last(path)!
    if (index <= 0 || !root?.value || !path || path.length < 2) return
    const newParentPath = [...path.slice(0, path.length - 1), index - 1]
    const parentBlock = getBlockByPath(root.value, newParentPath)
    const newPath = [...newParentPath, parentBlock.children?.length ?? 0]
    return move(path, newPath)
  }

  return { move, moveUpper, moveLower }
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
    const mergeParent = getBlockByPath(root!.value, [...mergePath.slice(0, mergePath.length - 1)])
    logger.i('merge', originPath, originParent, origin, mergePath, mergeBlock)
    
    const { ops, originLength: offset } = concat(mergeBlock.data.ops, origin.data.ops)
    blockInstances.get(mergeParent.id)?.updateBlock(
      mergePath[mergePath.length - 1],
      {
        data: {
          ...mergeBlock.data,
          ops
        },
        children: [
          ...(mergeBlock.children || []),
          ...(origin.children || [])
        ]
      },
      mergeBlock)
    blockInstances.get(originParent.id)?.removeBlock(originPath[originPath.length - 1], originPath, { autoFocusBefore: false, moveChildrenToPrev: true })
    setTimeout(() => {
      moveCaret(document.body.querySelector<HTMLDivElement>(`[data-block-id=${JSON.stringify(mergeBlock.id)}] [data-focusable]`)!, offset)
    })
  }

  return { merge }
}
