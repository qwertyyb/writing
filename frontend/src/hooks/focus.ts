import { getCaretOffset, getCaretPosition, getSelectionPosition, moveCaret, moveCaretToEnd, moveCaretToStart } from '@/models/caret'
import { createLogger } from '@/utils/logger'
import { onBeforeUnmount, onMounted, ref } from 'vue'

const logger = createLogger('focus')

let focusedEl: HTMLElement | null = null

export const focusBefore = () => {
  const doms = Array.from(document.querySelectorAll<HTMLElement>('[data-focusable]'))
  const index = (focusedEl && doms.indexOf(focusedEl)) ?? -1
  if (doms[0] && (!focusedEl || index === -1)) {
    doms[0].focus()
  } else if (index > 0) {
    doms[index - 1].focus()
  }
}

export const focusAfter = () => {
  const doms = Array.from(document.querySelectorAll<HTMLElement>('[data-focusable]'))
  const index = (focusedEl && doms.indexOf(focusedEl)) ?? -1
  if (doms[0] && !focusedEl) {
    doms[0].focus()
  } else if (doms[index + 1]) {
    doms[index + 1].focus()
  }
}

export const useFocusEvent = () => {
  const focusHandler = (event: FocusEvent) => {
    focusedEl = (event.target as HTMLElement)
  }

  onMounted(() => {
    window.addEventListener('focusin', focusHandler)
  })
  onBeforeUnmount(() => {
    window.removeEventListener('focusin', focusHandler)
  })
}

export const useFocusControl = () => {
  const el = ref<HTMLDivElement>()

  const keydownHandler = (event: KeyboardEvent) => {
    if (event.code === 'ArrowUp') {
      focusBefore()
      moveCaretToEnd(document.activeElement! as HTMLElement)
    } else if (event.code === 'ArrowDown') {
      focusAfter()
      moveCaretToStart(document.activeElement! as HTMLElement)
    }
  }

  return { el, keydownHandler }
}

const getActivedClosestBlockEl = (): HTMLElement | null => {
  if (!document.activeElement) return null
  const el = document.activeElement.closest<HTMLElement>('.rich-text-editor-wrapper')
  return el
}

export const useFocus = () => {
  let selectionInfo = { id: '', offset: 0 }
  let caretOffset = 0
  let isMovingCaret = false

  const selectionChangeHandler = () => {
    // if (mode.value === Mode.Readonly) return
    const selection = window.getSelection()
    const pos = getSelectionPosition(document.querySelector('.rich-text-editor-wrapper')!)
    if (pos) {
      // history.push({ selection: pos })
    }
    logger.i('selection', selection, getSelectionPosition(getActivedClosestBlockEl()!))
    if (!selection) return
    if (selection.rangeCount < 1) return
    const range = selection.getRangeAt(0)
    if (!range) return
    const { startContainer } = range
    const closestBlockEl = (startContainer as HTMLElement)?.dataset?.blockId ? startContainer as HTMLElement : startContainer.parentElement?.closest<HTMLElement>('[data-block-id]')
    if (!closestBlockEl) return
    const id = closestBlockEl.dataset.blockId as string
    const closestEditableEl = (startContainer as HTMLElement).contentEditable ? startContainer as HTMLElement : startContainer.parentElement?.closest<HTMLElement>('[contenteditable], input')
    if (!closestEditableEl) return
    selectionInfo = { id, offset: getCaretOffset(closestEditableEl) }
    logger.i('selection info', selectionInfo)
    if (isMovingCaret) return
    caretOffset = selectionInfo.offset
    logger.i('caretOffset', caretOffset)
  }

  const isInFirstLine = () => {
    const selection = window.getSelection()
    if (!selection || !document.activeElement) return false
    if (selection.rangeCount < 1) return false
    const range = selection.getRangeAt(0)
    if (!range) return false
    const { top } = range.getBoundingClientRect()
    const { top: pTop } = document.activeElement.getBoundingClientRect()
    logger.i('isInFirstLine', top, pTop)
    return top - pTop < 16
  }

  const isInLastLine = () => {
    const selection = window.getSelection()
    if (!selection || !document.activeElement) return false
    if (selection.rangeCount < 1) return false
    const range = selection.getRangeAt(0)
    if (!range) return false
    const { bottom } = range.getBoundingClientRect()
    const { bottom: pBottom } = document.activeElement.getBoundingClientRect()
    logger.i('isInLastLine', range.getBoundingClientRect(), pBottom)
    return pBottom - bottom < 16
  }

  const keydownHandler = (event: KeyboardEvent) => {
    logger.i('caret', getCaretPosition())
    if (event.code === 'ArrowUp' && isInFirstLine()) {
      isMovingCaret = true
      event.preventDefault()
      focusBefore()
      moveCaret(document.activeElement ! as HTMLElement, caretOffset)
    } else if (event.code === 'ArrowDown' && isInLastLine()) {
      isMovingCaret = true
      event.preventDefault()
      focusAfter()
      moveCaret(document.activeElement ! as HTMLElement, caretOffset)
    } else {
      isMovingCaret = false
      caretOffset = selectionInfo.offset
    }
  }

  const pointerdownHandler = () => {
    isMovingCaret = false
    caretOffset = selectionInfo.offset
  }
  
  onMounted(() => {
    document.addEventListener('selectionchange', selectionChangeHandler)
    document.addEventListener('keydown', keydownHandler, true)
    // document.addEventListener('pointerdown', pointerdownHandler)
  })
  
  onBeforeUnmount(() => {
    document.removeEventListener('selectionchange', selectionChangeHandler)
    document.removeEventListener('keydown', keydownHandler, true)
    // document.removeEventListener('pointerdown', pointerdownHandler)
  })
}
