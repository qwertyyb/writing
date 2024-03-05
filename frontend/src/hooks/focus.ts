import { getCaretOffset, getCaretPosition, getSelectionPosition, moveCaret, moveCaretToEnd, moveCaretToStart } from '@/models/caret'
import { createLogger } from '@/utils/logger'
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue'

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

const focusBlockImmediate = (id: string, pos: 'start' | 'end') => {
  const input: HTMLDivElement | null | undefined = document.body.querySelector<HTMLDivElement>(`[data-block-id=${JSON.stringify(id)}] [data-focusable]`)
  input?.focus()
  logger.i('focusBlock', input, id)
  input && (pos === 'end' && moveCaretToEnd(input) || pos === 'start' && moveCaretToStart(input))
}

export const focusBlock = (id: string, pos: 'start' | 'end' = 'end') => {
  setTimeout(() => {
    nextTick(() => {
      focusBlockImmediate(id, pos)
    })
  })
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
