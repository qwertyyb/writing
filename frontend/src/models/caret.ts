enum SelectionType {
  None = 'None',
  Caret = 'Caret', // 光标
  Range = 'Range', // 选择范围
}

export const getCaretPosition = () => {
  return window.getSelection()?.getRangeAt(0).getBoundingClientRect()
}

export const setCaretToEnd = (textDom: HTMLElement) => {
  const range = document.createRange();
  range.selectNodeContents(textDom.childNodes[0] ?? textDom);
  const sel = window.getSelection();
  sel?.removeAllRanges();
  sel?.addRange(range);
  sel?.collapseToEnd();
}

export const setCaretToStart = (textDom: HTMLElement) => {
  const range = document.createRange();
  range.selectNodeContents(textDom.childNodes[0] ?? textDom);
  const sel = window.getSelection();
  sel?.removeAllRanges();
  sel?.addRange(range);
  sel?.collapseToStart()
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
