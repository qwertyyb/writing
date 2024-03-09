import type { BlockModel } from "../models/block"
import { createLogger } from "@writing/utils/logger"
import { onBeforeUnmount, onMounted, type ModelRef, type Ref, nextTick } from "vue"

const logger = createLogger('history')

interface CursorPosition {
  path: number[],
  offset: number
}

export interface SelectionPosition {
  from: CursorPosition,
  to: CursorPosition
}

const getNodeFromPath = (anchor: HTMLElement, path: number[]) => {
  let cur = path.shift()
  let curNode: Node = anchor
  while(cur !== undefined) {
    curNode = curNode.childNodes[cur]
    cur = path.shift()
  }
  return curNode
}

const getPathFromNode = (ancestor: HTMLElement, node: Node) => {
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

const setSelectionPosition = (anchor: HTMLElement, pos: SelectionPosition) => {
  const start = getNodeFromPath(anchor, [...pos.from.path])
  const end = getNodeFromPath(anchor, [...pos.to.path])

  const range = document.createRange()
  range.setStart(start, pos.from.offset)
  range.setEnd(end, pos.to.offset)
  window.getSelection()?.removeAllRanges()
  window.getSelection()?.addRange(range)
}

const getSelectionPosition = (element: HTMLElement) => {
  const selection = window.getSelection()
  if (!selection) return null
  if (selection.rangeCount <= 0) return null
  const range = selection.getRangeAt(0)
  if (!range) return null
  const { startContainer, startOffset, endContainer, endOffset } = range
  if (element !== startContainer && !element.contains(startContainer)) return null
  
  const fromPath = getPathFromNode(element, startContainer)
  const toPath = getPathFromNode(element, endContainer)
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

const stepEq = (left: HistoryStep, right: HistoryStep) => {
  return left.doc === right.doc
}

interface HistoryStep {
  doc: string,
  selection: SelectionPosition | null
}

class History {
  steps: HistoryStep[] = []
  cursor = 0

  constructor(private options: { updateValue: (value: HistoryStep) => void }) {
  }

  push(step: HistoryStep) {
    const lastest = this.steps[this.steps.length - 1 + this.cursor]
    if (lastest && stepEq(step, lastest)) return
    this.steps = this.steps.slice(0, this.steps.length + this.cursor)
    this.steps.push(JSON.parse(JSON.stringify(step)))

    logger.i('history push', JSON.parse(JSON.stringify(step)), this.steps.length)

    this.cursor = 0
  }

  undo() {
    this.cursor -= 1
    logger.i('undo, length: ', this.steps.length, 'cur: ', this.steps.length - 1 + this.cursor)
    if (this.steps.length - 1 + this.cursor < 0) return
    const step = this.steps[this.steps.length - 1 + this.cursor]
    this.options.updateValue(step)
  }

  redo() {
    this.cursor += 1
    if (this.cursor > 0) return

    const step = this.steps[this.steps.length - 1 + this.cursor]
    this.options.updateValue(step)
  }
}

export const useHistory = (
  container: Ref<HTMLElement | undefined>,
  doc: ModelRef<BlockModel>,
) => {
  const focusHandler = async (event: FocusEvent) => {
    logger.i('focusHandler', event)
    setTimeout(() => {
      const selection = getSelectionPosition(container.value!)
      history.push({
        doc: JSON.stringify(doc.value),
        selection
      })
    })
    container.value!.removeEventListener('focusin', focusHandler)
  }

  onMounted(() => {
    container.value!.addEventListener('focusin', focusHandler)
  })
  
  onBeforeUnmount(() => {
    container.value!.removeEventListener('focusin', focusHandler)
  })

  const updateValue = async (step: HistoryStep) => {
    doc.value = JSON.parse(step.doc)
    if (!step.selection) return
    await nextTick()
    setSelectionPosition(
      container.value!,
      step.selection
    )
  }

  const pushLatest = async () => {
    setTimeout(() => {
      const selection = getSelectionPosition(container.value!)
      if (!selection) return
      history.push({
        doc: JSON.stringify(doc.value),
        selection
      })
    }, 0)
  }

  const history = new History({ updateValue })
  return {
    undo: history.undo.bind(history),
    redo: history.redo.bind(history),

    pushLatest
  }
}

