import { setCaretToEnd } from '@/models/caret'
import { onBeforeUnmount, onMounted, nextTick } from 'vue'

let focusedEl: HTMLElement | null = null

export const focusBefore = () => {
  const doms = Array.from(document.querySelectorAll<HTMLElement>('[data-focusable]'))
  const index = (focusedEl && doms.indexOf(focusedEl)) ?? -1
  if (doms[0] && (!focusedEl || index === -1)) {
    doms[0].focus()
    // setTimeout(() => setCaretToEnd(doms[0]))
  } else if (index > 0) {
    doms[index - 1].focus()
    // setTimeout(() => {
    //   setCaretToEnd(doms[index - 1])
    // })
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