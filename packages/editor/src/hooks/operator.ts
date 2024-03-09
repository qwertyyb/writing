import { BlockTree, OperateSource, rootSymbol } from "../models/BlockTree"
import type { BlockModel } from "../models/block"
import { type ShallowRef, inject, computed, Ref, ref, watch, nextTick, toRaw, shallowRef } from "vue"
import * as R from 'ramda'
import { createLogger } from "@writing/utils/logger"
import { getOps, join } from "@writing/utils/delta"
import { moveCaret } from "../models/caret"
import { SelectionRange, SelectionState, setSelectionRange } from "./selection"
import Delta from "quill-delta"

const logger = createLogger('operator')

export const isTextBlock = (block: BlockModel) => ['text', 'heading1', 'heading2', 'heading3', 'heading4', 'heading5', 'heading6'].includes(block.type)

export const useOperator = (props: { path: number[] }) => {
  const rootValue = inject<ShallowRef<BlockTree>>(rootSymbol)

  const addBlock = (index: number, data: Partial<BlockModel>) => {
    const prevPath = [...props.path, index]
    const prev = rootValue?.value.getByPath(prevPath)
    return rootValue?.value.startTransaction(() => {
      const children = data?.children ?? prev?.children ?? []
      rootValue?.value.addAfter([...props.path, index], { ...data, children }, OperateSource.User)
      rootValue?.value.update(
        prevPath,
        { children: [] }
      )
    }, OperateSource.User)
  }

  const updateBlock = (index: number, data: Partial<BlockModel>) => {
    return rootValue?.value.startTransaction(() => rootValue?.value.update([...props.path, index], data), OperateSource.User)
  }

  const removeBlock = (index: number) => {
    return rootValue?.value.startTransaction(() => {
      const removed = rootValue?.value.remove([...props.path, index])
      const { path: prevPath, block: prev } = rootValue!.value.getPrev([...props.path, index])!
      rootValue!.value.update(
        prevPath,
        { children: [ ...prev.children, ... removed.children ] }
      )
    }, OperateSource.User)
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
      rootValue!.value.addAfter(newPath, removed, OperateSource.User)
    }, OperateSource.User)
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
      }, OperateSource.User)
    }, OperateSource.User)
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
    }, OperateSource.User)
    setTimeout(() => {
      moveCaret(document.body.querySelector<HTMLDivElement>(`[data-block-id=${JSON.stringify(mergeBlock.id)}] [data-focusable]`)!, offset)
    })
  }

  return { merge }
}

export const useFormat = (propsSelection: SelectionState) => {
  const rootValue = inject<ShallowRef<BlockTree>>(rootSymbol)
  const link = ref<string | null>('')
  const savedSelection = shallowRef<SelectionState>()

  const selection = computed(() => {
    return savedSelection.value || propsSelection
  })

  const formats = computed<Record<string, any>>(() => {
    logger.i('formats', selection.value.range)
    if (!selection.value.range) return {};
    return getFormats(selection.value.range)
  })

  const getFormats = (selection: SelectionRange) => {
    if (!selection) return {
      bold: false, italic: false, link: false, code: false
    }
    const formats = {
      bold: [], italic: [], link: [], code: [], strike: [], underline: [],
      script: [],
      background: [], color: [],
      size: []
    }
    rootValue?.value.walkTreeBetween(
      selection.from.path,
      selection.to.path,
      (path, block) => {
        if (!isTextBlock(block)) return
  
        const delta = new Delta(block.data.ops)
        const start = R.equals(path, selection.from.path) ? selection.from.offset : 0
        const end = R.equals(path, selection.to.path) ? selection.to.offset : delta.length()
        const ops = getOps(block.data.ops, { index: start, length: end - start})
        R.forEach(
          (op) => {
            R.forEach(
              ([key, value]: [string, any[]]) => {
                value.push((op as any).attributes?.[key])
              },
              R.toPairs(formats)
            )
          },
          ops
        )
      }
    )
    const result = R.map((value) => {
      const uniqValue = R.uniq(value)
      return uniqValue.length > 1 ? false : R.head(uniqValue)
    }, formats)
    logger.i('formats', result)
    return result
  }

  const setFormats = (formats: Record<string, any>) => {
    const { from, to } = selection.value.range
    rootValue?.value.walkTreeBetween(
      from.path,
      to.path,
      (path, block) => {
        if (!isTextBlock(block)) return
        const delta = new Delta(block.data.ops)
        const start = R.equals(path, from.path) ? from.offset : 0
        const end = R.equals(path, to.path) ? to.offset : delta.length()
  
        const ops = delta.compose(new Delta().retain(start).retain(end - start, formats)).ops
  
        rootValue?.value.update(path, {
          data: {
            ...block.data,
            ops
          }
        })
      }
    )
  }

  const formatText = (name: string, value: boolean | string) => {
    const range = toRaw(selection.value.range)
    logger.i('formatText', name, value, range)
    setFormats({
      [name]: value
    })
    nextTick(() => {
      setSelectionRange(range)
    })
  }
  
  const toggleFormat = (format: string) => {
    let name = format
    let value: string | boolean = !formats.value[name]
    formatText(name, value)
  }
  
  const setSizeFormat = (action: 'decrease' | 'increase') => {
    let size = formats.value.size ? parseInt(formats.value.size) : 16
    if (action === 'decrease') {
      size = Math.max(10, size - 1)
    } else {
      size = Math.min(110, size + 1)
    }
    formatText('size', size + 'px')
  }

  const saveSelection = () => {
    logger.i('saveRange', selection.value.range)
    savedSelection.value = JSON.parse(JSON.stringify(selection.value))
  }

  const restoreRange = () => {
    if (!savedSelection.value) return
    setSelectionRange(savedSelection.value.range)
  }

  const setLinkFormat = () => {
    restoreRange()
    setTimeout(() => {
      savedSelection.value = null
      const value = link.value || null
      formatText('link', value)
    })
  }

  return {
    formats, link, selection,
    toggleFormat, formatText, setSizeFormat, setLinkFormat,
    saveSelection
  }
}
