import { BlockTree, rootSymbol } from "@/models/BlockTree"
import type { BlockModel } from "@/models/block"
import { type ShallowRef, inject } from "vue"
import * as R from 'ramda'
import { createLogger } from "@/utils/logger"
import { checkMove } from "./move"
import { concat } from "@/models/delta"
import { moveCaret } from "@/models/caret"

const logger = createLogger('operator')

export const useOperator = (props: { path: number[] }) => {
  const rootValue = inject<ShallowRef<BlockTree>>(rootSymbol)

  const addBlock = (index: number, data: Partial<BlockModel>) => {
    const prevPath = [...props.path, index]
    const prev = rootValue?.value.getByPath(prevPath)
    return rootValue?.value.update(() => {
      const children = data.children ?? prev?.children ?? []
      rootValue?.value.addChildAfter([...props.path, index], { ...data, children })
      rootValue?.value.updateChild(
        prevPath,
        { children: [] }
      )
    })
  }

  const updateBlock = (index: number, data: Partial<BlockModel>) => {
    return rootValue?.value.update(() => rootValue?.value.updateChild([...props.path, index], data))
  }

  const removeBlock = (index: number) => {
    return rootValue?.value.update(() => {
      const removed = rootValue?.value.removeChild([...props.path, index])
      const { path: prevPath, block: prev } = rootValue!.value.getPrev([...props.path, index])!
      rootValue!.value.updateChild(
        prevPath,
        { children: [ ...prev.children, ... removed.children ] }
      )
    })
  }

  return { addBlock, updateBlock, removeBlock }
}

export const useMove = () => {
  const rootValue = inject<ShallowRef<BlockTree>>(rootSymbol)

  const move = (oldPath: number[], newPath: number[]) => {
    const { oldPathParent, newPathParent, } = checkMove(rootValue!.value.model, oldPath, newPath)
    logger.i('move, path:', { oldPath, oldPathParent }, { newPath, newPathParent })
    rootValue?.value.update(() => {
      const removed = rootValue!.value.removeChild(oldPath)
      logger.i('move, removed: ', JSON.parse(JSON.stringify(removed)))
      rootValue!.value.addChildAfter(newPath, removed)
    })
  }

  const moveUpper = (path: number[]) => {
    if (!path || path.length <= 2) return false
    const newPosParent = rootValue!.value.getByPath(path.slice(0, path.length - 2))
    const newPosIndex = path[path.length - 2]
    const oldParent = newPosParent.children![newPosIndex]
    const oldIndex = path[path.length - 1]
    const oldBlock = oldParent.children![oldIndex]
    const afterChildren = oldParent.children!.slice(oldIndex + 1)
    logger.i('moveUpper', oldParent, oldIndex, newPosParent)

    rootValue?.value.update(() => {
      rootValue!.value.updateChild(path.slice(0, path.length - 1), {
        children: oldParent.children?.slice(0, oldIndex) || []
      })
      rootValue!.value.addChildAfter(path.slice(0, path.length - 1), {
        ...oldBlock,
        children: [
          ...oldBlock.children || [],
          ...afterChildren
        ]
      })
    })
  }

  const moveLower = (path: number[]) => {
    const index = R.last(path)!
    if (index <= 0 || !rootValue?.value || !path || path.length < 2) return
    const newParentPath = [...path.slice(0, path.length - 1), index - 1]
    const parentBlock = rootValue!.value.getByPath(newParentPath)
    const newPath = [...newParentPath, parentBlock.children?.length ?? 0]
    return move(path, newPath)
  }

  return { move, moveUpper, moveLower }
}

export const useMerge = () => {
  const rootValue = inject<ShallowRef<BlockTree>>(rootSymbol)

  const merge = (originPath: number[]) => {
    const { path: mergePath, block: mergeBlock } = rootValue!.value.getPrev(originPath, (_, block) => block.type === 'text') ?? {}
    if (!mergePath || !mergeBlock) return
    const origin = rootValue!.value.getByPath(originPath)
    
    const { ops, originLength: offset } = concat(mergeBlock.data.ops, origin.data.ops)
    rootValue?.value.update(() => {
      rootValue!.value.updateChild(mergePath, {
        data: {
          ...mergeBlock.data,
          ops
        },
        children: [
          ...(mergeBlock.children || []),
          ...(origin.children || [])
        ]
      })
      rootValue!.value.removeChild(originPath)
    })
    setTimeout(() => {
      moveCaret(document.body.querySelector<HTMLDivElement>(`[data-block-id=${JSON.stringify(mergeBlock.id)}] [data-focusable]`)!, offset)
    })
  }

  return { merge }
}
