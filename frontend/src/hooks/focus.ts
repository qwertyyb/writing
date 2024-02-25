import { getCaretOffset, moveCaret, moveCaretToEnd, moveCaretToStart } from '@/models/caret'
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
