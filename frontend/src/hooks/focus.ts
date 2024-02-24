import { isInHeading, isInTailing, moveCaretToEnd } from '@/models/caret'
import { onBeforeUnmount, onMounted, ref } from 'vue'

let focusedEl: HTMLElement | null = null

export const focusBefore = () => {
  const doms = Array.from(document.querySelectorAll<HTMLElement>('[data-focusable]'))
  const index = (focusedEl && doms.indexOf(focusedEl)) ?? -1
  if (doms[0] && (!focusedEl || index === -1)) {
    doms[0].focus()
    moveCaretToEnd(doms[0])
  } else if (index > 0) {
    doms[index - 1].focus()
    moveCaretToEnd(doms[index - 1])
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
      if (isInHeading(el.value!)) {
        focusBefore()
      }
    } else if (event.code === 'ArrowDown') {
      if (isInTailing(el.value!)) {
        focusAfter()
      }
    }
  }

  return { el, keydownHandler }
}