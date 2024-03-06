import { createLogger } from "@writing/utils/logger";

const logger = createLogger('caret')

enum SelectionType {
  None = 'None',
  Caret = 'Caret', // 光标
  Range = 'Range', // 选择范围
}

export const getCaretPosition = () => {
  return window.getSelection()?.getRangeAt(0).getBoundingClientRect()
}

export const isCaret = () => window.getSelection()?.type === SelectionType.Caret

/**
 * 当前光标是否在最开头
 */
export const isInHeading = (element: Node) => {
  if (!isCaret()) return false

  const selection = window.getSelection()!
  if (selection.anchorOffset !== 0 || selection.rangeCount < 1) return false

  const srange = selection.getRangeAt(0)
  const range = document.createRange()
  range.setStart(element, 0)
  range.setEnd(srange.endContainer, srange.endOffset)
  return range.toString().length === 0
}

/**
 * 当前光标是否在结尾
 * @param element 
 */
export const isInTailing = (element: Node) => {
  if (!isCaret()) return false

  const selection = window.getSelection()!
  if (selection.rangeCount < 1) return false

  const srange = selection.getRangeAt(0)
  const range = document.createRange()
  range.setStart(srange.startContainer, srange.startOffset)
  range.setEnd(element, 0)
  return range.toString().length === 0
}

export const splitWithCaret = (element: HTMLElement) => {
  logger.i('splitWithCaret', element)
  const selection = window.getSelection()
  if ((selection?.rangeCount ?? 0) < 1) return null
  const { startContainer, startOffset } = selection!.getRangeAt(0)
  if (startContainer === element) {
    if (startOffset === 0) {
      return ['', element.textContent]
    } else if (startOffset === 1) {
      return [element.textContent, '']
    }
  }
  logger.i('splitWithCaret startContainer', startContainer, startOffset)
  if (!element.contains(startContainer)) return null

  const iterator = document.createNodeIterator(element, NodeFilter.SHOW_TEXT)
  let offset = 0
  while(iterator.nextNode()) {
    const node = iterator.referenceNode
    if (node === startContainer) {
      break
    }
    offset += (node.textContent?.length ?? 0)
  }
  offset += startOffset
  const before = element.textContent?.substring(0, offset) ?? ''
  const after = element.textContent?.substring(offset) ?? ''
  logger.i('splitWithCaret before: ', before, 'after: ', after)
  return [ before, after ]
}

export const moveCaret = (element: HTMLElement, offset: number) => {
  logger.i('moveCaret', element, offset)
  if (offset === 0) {
    return moveCaretToStart(element)
  }
  const nodeIterator = document.createNodeIterator(element, NodeFilter.SHOW_TEXT)

  let focusNode: Node | null = null
  let lastNode: Node | null = null
  while(!focusNode && nodeIterator.nextNode()) {
    lastNode = nodeIterator.referenceNode
    if ((nodeIterator.referenceNode.nodeValue?.length ?? 0) >= offset) {
      focusNode = nodeIterator.referenceNode
    } else {
      offset -= (nodeIterator.referenceNode.nodeValue?.length ?? 0)
    }
  }
  if (!focusNode) {
    focusNode = lastNode || element
    offset = focusNode?.nodeValue?.length ?? 0
  }
  logger.i('focusNode', focusNode, offset)
  const selection = window.getSelection()
  selection?.setPosition(focusNode, offset)
}

export const moveCaretToEnd = (element: HTMLElement) => {
  logger.i('moveCaretToEnd', element)
  moveCaret(element, element.textContent?.length ?? 0)
}

export const moveCaretToStart = (element: HTMLElement) => {
  logger.i('moveCaretToStart', element)
  const selection = window.getSelection()!
  selection.setPosition(element, 0)
}

export const getCaretOffset = (element: HTMLElement) => {
  logger.i('getCaretPosition', element)
  const selection = window.getSelection()
  if (!selection || !element.contains(selection.anchorNode) || selection.anchorNode?.nodeType !== Node.TEXT_NODE) return 0

  const iterator = document.createNodeIterator(element, NodeFilter.SHOW_TEXT)
  
  let offset = 0
  while(iterator.nextNode() !== selection.anchorNode) {
    offset += (iterator.referenceNode.nodeValue?.length ?? 0)
  }
  offset += selection.anchorOffset
  logger.i('getCaretPosition offset', offset)
  return offset
}

export const getSelectionOffset = (element: HTMLElement, node: Node) => {
  if (!element.contains(node) || node?.nodeType !== Node.TEXT_NODE) return 0

  const iterator = document.createNodeIterator(element, NodeFilter.SHOW_TEXT)
  
  let offset = 0
  while(iterator.nextNode() !== node) {
    offset += (iterator.referenceNode.nodeValue?.length ?? 0)
  }
  logger.i('getSelectionPosition offset', offset)
  return offset
}

const getPath = (ancestor: HTMLElement, node: Node) => {
  const path = []
  let cur: Node | null = node
  while(cur && ancestor !== cur) {
    const parent: Node = cur.parentNode!
    const index = Array.from(parent!.childNodes).findIndex(node => node === cur)
    path.unshift(index)
    cur = parent
  }
  return path
}

const getNode = (anchor: HTMLElement, path: number[]) => {
  let cur = path.shift()
  let curNode: Node = anchor
  while(cur !== undefined) {
    curNode = curNode.childNodes[cur]
    cur = path.shift()
  }
  return curNode
}

interface CursorPosition {
  path: number[],
  offset: number
}

export interface SelectionPosition {
  from: CursorPosition,
  to: CursorPosition
}

export const eq = (left: SelectionPosition, right: SelectionPosition) => {
  return JSON.stringify(left) === JSON.stringify(right)
}

export const getSelectionPosition = (element: HTMLElement) => {
  const selection = window.getSelection()
  if (!selection) return null
  if (selection.rangeCount <= 0) return null
  const range = selection.getRangeAt(0)
  if (!range) return null
  const { startContainer, startOffset, endContainer, endOffset } = range
  if (element !== startContainer && !element.contains(startContainer)) return null
  
  const fromPath = getPath(element, startContainer)
  const toPath = getPath(element, endContainer)
  return {
    from: {
      path: fromPath,
      offset: startOffset
    },
    to: {
      path: toPath,
      offset: endOffset
    }
  }
}

export const setSelectionPosition = (anchor: HTMLElement, pos: SelectionPosition) => {
  const start = getNode(anchor, [...pos.from.path])
  const end = getNode(anchor, [...pos.to.path])

  const range = document.createRange()
  range.setStart(start, pos.from.offset)
  range.setEnd(end, pos.to.offset)
  window.getSelection()?.removeAllRanges()
  window.getSelection()?.addRange(range)
}

// @ts-ignore
window.setSelectionPosition = setSelectionPosition
