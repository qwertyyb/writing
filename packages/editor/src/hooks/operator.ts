import { BlockTree, rootSymbol } from "../models/BlockTree"
import type { BlockModel } from "../models/block"
import { type ShallowRef, inject } from "vue"
import * as R from 'ramda'
import { createLogger } from "@writing/utils/logger"
import { join } from "@writing/utils/delta"
import { moveCaret } from "../models/caret"

const logger = createLogger('operator')

export const useOperator = (props: { path: number[] }) => {
  const rootValue = inject<ShallowRef<BlockTree>>(rootSymbol)

  const addBlock = (index: number, data: Partial<BlockModel>) => {
    const prevPath = [...props.path, index]
    const prev = rootValue?.value.getByPath(prevPath)
    return rootValue?.value.startTransaction(() => {
      const children = data?.children ?? prev?.children ?? []
      rootValue?.value.addAfter([...props.path, index], { ...data, children })
      rootValue?.value.update(
        prevPath,
        { children: [] }
      )
    })
  }

  const updateBlock = (index: number, data: Partial<BlockModel>) => {
    return rootValue?.value.startTransaction(() => rootValue?.value.update([...props.path, index], data))
  }

  const removeBlock = (index: number) => {
    return rootValue?.value.startTransaction(() => {
      const removed = rootValue?.value.remove([...props.path, index])
      const { path: prevPath, block: prev } = rootValue!.value.getPrev([...props.path, index])!
      rootValue!.value.update(
        prevPath,
        { children: [ ...prev.children, ... removed.children ] }
      )
    })
  }

  return { addBlock, updateBlock, removeBlock }
}

export type OperateActions = ReturnType<typeof useOperator>

export const useMove = () => {
  const rootValue = inject<ShallowRef<BlockTree>>(rootSymbol)

  const canMove = (oldPath: number[], newPath: number[]) => {
    // 1. 首先判断能否移动
    /**
     * 能否移动的判断标准为:
     * a. 旧路径上该节点存在
     * b. 能到达新路径
     */
    // 判断旧路径该节点存在，即通过旧路径能拿到该节点
    // 不能移动root节点，所以oldPath的长度至少为2
    if (oldPath.length < 1) {
      throw new Error('旧路径不合法，无法移动')
    }
    const oldPathParentNode = rootValue?.value.getByPath(oldPath.slice(0, oldPath.length - 1))
    const oldIndex = oldPath[oldPath.length - 1]
    if (!oldPathParentNode?.children?.[oldIndex]) {
      throw new Error('待移动的节点不存在')
    }
  
    // 新路径合法性的判断，首先需要判断其路径的父节点存在，因为最后的子节点是待移入的，所以是有可能不存在的
    // 其次需要判断待移入的节点在父节点的合法性，比如不能超出当前子节点的数量，不能为负数等
    // 所以新路径的最短长度为2，即移动为root节点的直接子节点
    if (newPath.length < 2) {
      throw new Error('新路径不合法，无法移动')
    }
    const newPathParentNode = rootValue?.value.getByPath(newPath.slice(0, newPath.length - 1))
    const newIndex = newPath[newPath.length - 1]
    if (newIndex < 0 || newIndex > (newPathParentNode?.children?.length ?? 0)) {
      throw new Error('新路径不存在')
    }
    return true
  }

  const move = (oldPath: number[], newPath: number[]) => {
    canMove(oldPath, newPath)
    logger.i('move, from:', [...oldPath], [...newPath])
    rootValue?.value.startTransaction(() => {
      const removed = rootValue!.value.remove(oldPath)
      logger.i('move, removed: ', JSON.parse(JSON.stringify(removed)))
      rootValue!.value.addAfter(newPath, removed)
    })
  }

  const moveUpper = (path: number[]) => {
    if (!path || path.length < 2) return false
    const newPosParent = rootValue!.value.getByPath(path.slice(0, path.length - 2))
    const newPosIndex = path[path.length - 2]
    const oldParent = newPosParent.children![newPosIndex]
    const oldIndex = path[path.length - 1]
    const oldBlock = oldParent.children![oldIndex]
    const afterChildren = oldParent.children!.slice(oldIndex + 1)
    logger.i('moveUpper', oldParent, oldIndex, newPosParent)

    rootValue?.value.startTransaction(() => {
      rootValue!.value.update(path.slice(0, path.length - 1), {
        children: oldParent.children?.slice(0, oldIndex) || []
      })
      rootValue!.value.addAfter(path.slice(0, path.length - 1), {
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
    if (index <= 0 || !rootValue?.value || !path || path.length < 1) return
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
    
    const { ops, originLength: offset } = join(mergeBlock.data.ops, origin.data.ops)
    rootValue?.value.startTransaction(() => {
      rootValue!.value.update(mergePath, {
        data: {
          ...mergeBlock.data,
          ops
        },
        children: [
          ...(mergeBlock.children || []),
          ...(origin.children || [])
        ]
      })
      rootValue!.value.remove(originPath)
    })
    setTimeout(() => {
      moveCaret(document.body.querySelector<HTMLDivElement>(`[data-block-id=${JSON.stringify(mergeBlock.id)}] [data-focusable]`)!, offset)
    })
  }

  return { merge }
}
