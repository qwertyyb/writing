import { createLogger } from "@writing/utils/logger"
import { type Ref, onMounted, onBeforeUnmount, ref, toRaw } from "vue"
import { getSelectionOffset } from "../models/caret"

const logger = createLogger('selection')

export interface SelectionBlockPosition {
  path: number[],
  offset: number
}

export interface SelectionRange {
  from: SelectionBlockPosition,
  to: SelectionBlockPosition
}

export interface SelectionState {
  range: SelectionRange | null,
  rect: {
    top: number, left: number
    width: number, height: number
  } | null
}


const getBlockElFromNode = (node: Node): HTMLElement | null => {
  let blockId = (node as HTMLElement)?.dataset?.blockId
  if (blockId) return node as HTMLElement
  blockId = node?.parentElement?.dataset.blockId
  if (blockId) return node.parentElement as HTMLElement
  return node?.parentElement?.closest<HTMLElement>('[data-block-id]') ?? null
}

const getBlockIdFromPoint = (x: number, y: number) => {
  const element = document.elementFromPoint(x, y) as HTMLElement
  if (element.dataset?.blockId) return element.dataset.blockId
  const closestBlockEl = element.closest<HTMLElement>('[data-block-id]')
  return closestBlockEl?.dataset!.blockId
}

const getBlockIdFromNode = (node: Node): string | null => {
  const blockEl = getBlockElFromNode(node)
  return blockEl?.dataset.blockId ?? null
}

export const getSelectionRange = (range: Range): SelectionRange => {
  const startBlockEl = getBlockElFromNode(range.startContainer)
  const startBlockPath = startBlockEl?.dataset.blockPath?.split(',').map(i => Number(i))
  const startOffset = getSelectionOffset(startBlockEl!, range.startContainer) + range.startOffset

  const endBlockEl = getBlockElFromNode(range.endContainer)
  const endBlockPath = endBlockEl?.dataset.blockPath?.split(',').map(i => Number(i))
  const endOffset = getSelectionOffset(endBlockEl!, range.endContainer) + range.endOffset

  logger.i('rangeHandler from', [...startBlockPath], 'to', [...endBlockPath])
  logger.i('rangeHandler offset', startOffset, endOffset)
  
  return {
    from: {
      path: startBlockPath!,
      offset: startOffset
    },
    to: {
      path: endBlockPath!,
      offset: endOffset
    }
  }
}

const getNodeAndOffset = (position: SelectionBlockPosition) => {
  const { path, offset } = position
  const element = document.querySelector(`[data-block-path=${JSON.stringify(path.join(','))}]`)
  const iterator = document.createNodeIterator(element, NodeFilter.SHOW_TEXT)

  let nodeOffset = offset
  while(iterator.nextNode()) {
    const len = iterator.referenceNode.textContent.length
    if (len >= nodeOffset) {
      return { node: iterator.referenceNode, offset: nodeOffset }
    }
    nodeOffset -= len
  }
  return { node: iterator.referenceNode, offset: offset ? 1 : 0 }
}

export const setSelectionRange = (selection: SelectionRange) => {
  const { from, to } = selection
  const { node: startContainer, offset: startOffset } = getNodeAndOffset(from)
  const { node: endContainer, offset: endOffset } = getNodeAndOffset(to)
  window.getSelection()?.setBaseAndExtent(startContainer, startOffset, endContainer, endOffset)
}

export const setCaretPosition = (position: SelectionBlockPosition) => {
  const { node: startContainer, offset: startOffset } = getNodeAndOffset(position)
  window.getSelection()?.setBaseAndExtent(startContainer, startOffset, startContainer, startOffset)
}

export const useSelection = ({ el }: {
  el: Ref<HTMLElement | undefined>
}) => {
  const state = ref<SelectionState>({
    range: null,
    rect: null
  })

  let isMultiSelect = false

  let anchorNodeBlockId: string | null = null
  let anchorNode: Node | null = null
  let focusNode: Node | null = null
  let focusOffset = 0
  let anchorOffset = 0

  const clear = () => {
    logger.i('clear')
    state.value.range = null
    state.value.rect = null
    isMultiSelect = false
    el.value!.querySelectorAll<HTMLElement>('[data-origin-contenteditable]')
      .forEach(dom => {
        dom.contentEditable = dom.dataset.originContenteditable as string
        delete dom.dataset.originContenteditable
      })
  }

  const selectionInEditor = (selection: Selection) => {
    return el.value!.contains(selection.anchorNode) && el.value!.contains(selection.focusNode)
  }

  const rangeHandler = () => {
    const selection = window.getSelection()
    if (!selection || selection.rangeCount < 1) return
    const range = selection.getRangeAt(0)
    logger.i('rangeHandler', range)

    state.value.range = getSelectionRange(range)
    logger.i('rangeHandler selection', { ...toRaw(state.value.range) })

    const rect = range.getBoundingClientRect()
    state.value.rect = {
      width: rect.width,
      height: rect.height,
      top: rect.top,
      left: rect.left
    }
  }

  const selectionchangeHandler = () => {
    const selection = window.getSelection()
    if (selection.type === 'None') return
    if (!selection || !selectionInEditor(selection)) return clear()

    if (selection.anchorNode) {
      anchorNode = selection.anchorNode
      anchorOffset = selection.anchorOffset
      focusNode = selection.focusNode
      focusOffset = selection.focusOffset
      anchorNodeBlockId = getBlockIdFromNode(selection.anchorNode)
    } else {
      anchorNode = null
      anchorOffset = 0
      focusNode = null
      focusOffset = 0
      anchorNodeBlockId = null
    }

    state.value.rect = null

    if (selection.type === 'Caret') {
      clear()
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
        if (anchorNode && focusNode) {
          sel.setBaseAndExtent(anchorNode!, anchorOffset, focusNode!, focusOffset)
        }
        logger.i('pointermove', window.getSelection(), anchorNode, focusNode)
        return
      }
    }
  }
  return { state, pointermoveHandler, clear }
}