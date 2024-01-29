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
