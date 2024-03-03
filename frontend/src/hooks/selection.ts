import { createLogger } from "@/utils/logger"
import { type Ref, onMounted, onBeforeUnmount, inject, type ModelRef, ref } from "vue"
import { getBlockByPath } from "./move"
import type { BlockModel } from "@/models/block"
import { getSelectionOffset } from "@/models/caret"
import { append, insertAll, last, repeat, take } from "ramda"

const logger = createLogger('selection')

export interface SelectionBlockPosition {
  path: number[],
  propPath: (string | number)[],
  offset: number
}

export interface SelectionState {
  selection: {
    from: SelectionBlockPosition,
    to: SelectionBlockPosition
  } | null,
  rect: {
    top: number, left: number
    width: number, height: number
  } | null
}

export const useSelection = ({ el, root }: {
  root: ModelRef<BlockModel>,
  el: Ref<HTMLElement | undefined>
}) => {
  const state = ref<SelectionState>({
    selection: null,
    rect: null
  })

  let isMultiSelect = false

  let anchorNodeBlockId: string | null = null
  let anchorNode: Node | null = null
  let focusNode: Node | null = null
  let focusOffset = 0
  let anchorOffset = 0

  const getBlockIdFromPoint = (x: number, y: number) => {
    const element = document.elementFromPoint(x, y) as HTMLElement
    if (element.dataset?.blockId) return element.dataset.blockId
    const closestBlockEl = element.closest<HTMLElement>('[data-block-id]')
    return closestBlockEl?.dataset!.blockId
  }

  const getBlockElFromNode = (node: Node): HTMLElement | null => {
    let blockId = (node as HTMLElement)?.dataset?.blockId
    if (blockId) return node as HTMLElement
    blockId = node?.parentElement?.dataset.blockId
    if (blockId) return node.parentElement as HTMLElement
    return node?.parentElement?.closest<HTMLElement>('[data-block-id]') ?? null
  }

  const getBlockPropFromNode = (node: Node): string | null => {
    let blockProp = (node as HTMLElement)?.dataset?.blockProp
    if (blockProp) return blockProp
    blockProp = node?.parentElement?.dataset.blockProp
    if (blockProp) return blockProp
    return node?.parentElement?.closest<HTMLElement>('[data-block-prop]')?.dataset!.blockProp ?? null
  }

  const getBlockIdFromNode = (node: Node): string | null => {
    const blockEl = getBlockElFromNode(node)
    return blockEl?.dataset.blockId ?? null
  }

  const getBlockPathFromNode = (node: Node): number[] | null => {
    const blockEl = getBlockElFromNode(node)
    return blockEl?.dataset.blockPath?.split(',').map(i => Number(i)) ?? null
  }

  const resetContenteditable = () => {
    isMultiSelect = false
    el.value!.querySelectorAll<HTMLElement>('[data-origin-contenteditable]')
      .forEach(dom => {
        dom.contentEditable = dom.dataset.originContenteditable as string
        delete dom.dataset.originContenteditable
      })
  }

  const walkTree = (
    prefixPath: number[],
    ancestor: BlockModel,
    callback: (path: number[], block: BlockModel) => void
  ) => {
    logger.i('walkTree', ancestor)
    for(let i = 0; i < (ancestor.children?.length ?? 0); i+= 1) {
      logger.i('walkTree for', i)
      walkTree(
        [...prefixPath, i],
        ancestor.children![i],
        callback
      )
    }
    callback(prefixPath, ancestor)
  }

  const blocksBetween = (startPath: number[], endPath: number[]) => {
    let commonPath = startPath.length < endPath.length ? startPath.slice() : endPath.slice()
    for(let i = 0; i < Math.min(startPath.length, endPath.length); i+= 1) {
      if (startPath[i] !== endPath[i]) {
        commonPath = startPath.slice(0, i)
        break
      }
    }
    logger.i('blocksBetween', startPath, endPath, commonPath)
    const ancestor = getBlockByPath(root.value!, commonPath)
    let start = [...startPath]
    let end = [...endPath]
    if (startPath.length < endPath.length) {
      start = insertAll(start.length, repeat(0, endPath.length - startPath.length), start)
    } else if (endPath.length < startPath.length) {
      end = insertAll(end.length, repeat(-1, startPath.length - endPath.length), end)
    }

    logger.i('blocksBetween', start, end)

    for(let i = commonPath.length - 1; i < end.length; i += 1) {
      for (let j = start[i]; j <= end[i]; j += 1) {
        logger.i(i, j, start[i], end[j])
        walkTree(commonPath, ancestor.children![j], (path, block) => {
          logger.w('walkTree callback', [...path], { ...block })
        })
      }
    }
    
    // walkTree(
    //   [...commonPath],
    //   ancestor,
    //   startPath.slice(commonPath.length),
    //   endPath.slice(commonPath.length),
    //   (path, block) => {
    //     logger.w('walkTreeCallback', [...path], { ...block })
    //   }
    // )
  }

  const rangeHandler = () => {
    const selection = window.getSelection()
    if (!selection || selection.rangeCount < 1) return
    const range = selection.getRangeAt(0)
    const startBlockEl = getBlockElFromNode(range.startContainer)
    const startBlockId = startBlockEl?.dataset?.blockId
    const startBlockPath = startBlockEl?.dataset.blockPath?.split(',').map(i => Number(i))
    const startBlockProp = getBlockPropFromNode(range.startContainer)
    const startBlock = getBlockByPath(root!.value, startBlockPath!)

    const endBlockEl = getBlockElFromNode(range.endContainer)
    const endBlockId = endBlockEl?.dataset?.blockId
    const endBlockPath = endBlockEl?.dataset.blockPath?.split(',').map(i => Number(i))
    const endBlockProp = getBlockPropFromNode(range.endContainer)
    const endBlock = getBlockByPath(root!.value, endBlockPath!)

    // if (startBlock === endBlock) {

    // }

    blocksBetween(startBlockPath!, endBlockPath!)

    logger.i('rangeHandler', {
      startBlockId, startBlockPath, startBlockProp, endBlockId, endBlockPath, endBlockProp
    }, startBlock, endBlock)
    
    const doc = range.cloneContents()
    logger.i('rangeHandler', doc)

    state.value.selection = {
      from: {
        path: startBlockPath!,
        propPath: startBlockProp!.split(','),
        offset: getSelectionOffset(startBlockEl!, range.startContainer) + range.startOffset
      },
      to: {
        path: endBlockPath!,
        propPath: endBlockProp!.split(','),
        offset: getSelectionOffset(startBlockEl!, range.endContainer) + range.endOffset
      }
    }
    const rect = range.getBoundingClientRect()
    const pRect = el.value!.getBoundingClientRect()
    logger.i(rect, pRect, state.value)
    state.value.rect = {
      width: rect.width,
      height: rect.height,
      top: rect.top - pRect.top,
      left: rect.left - pRect.left
    }
  }

  const selectionchangeHandler = () => {
    const selection = window.getSelection()
    if (!selection) return
    if (selection.anchorNode) {
      anchorNode = selection.anchorNode
      anchorOffset = selection.anchorOffset
      focusNode = selection.focusNode
      focusOffset = selection.focusOffset
      anchorNodeBlockId = getBlockIdFromNode(selection.anchorNode)
    }

    state.value.rect = null

    if (selection.type === 'Caret') {
      resetContenteditable()
      return
    }

    rangeHandler()
  }

  onMounted(() => {
    document.addEventListener('selectionchange', selectionchangeHandler)
  })

  onBeforeUnmount(() => {
    document.removeEventListener('selectionchange', selectionchangeHandler)
  })

  const pointermoveHandler = (event: PointerEvent) => {
    if (event.buttons === 1 && !isMultiSelect) {
      const curBlockId = getBlockIdFromPoint(event.clientX, event.clientY)
      if (curBlockId !== anchorNodeBlockId) {
        // 鼠标移出了当前的块范围，设置为跨块多选模式
        isMultiSelect = true
        el.value!.querySelectorAll<HTMLElement>('[contenteditable="false"]')
          .forEach(dom => {
            dom.dataset.originContenteditable = dom.contentEditable
            dom.removeAttribute('contenteditable')
          })
        const sel = window.getSelection()
        if (!sel) return
  
        sel.setBaseAndExtent(anchorNode!, anchorOffset, focusNode!, focusOffset)
        logger.i('pointermove', window.getSelection(), anchorNode, focusNode)
        return
      }
    }
  }
  return { selection: state, pointermoveHandler }
}