import type { BlockModel } from "@/models/block"
import { getSelectionPosition, setSelectionPosition, type SelectionPosition } from "@/models/caret"
import { createLogger } from "@/utils/logger"
import { onBeforeUnmount, onMounted, type ModelRef, type Ref, nextTick } from "vue"

const logger = createLogger('history')

interface HistoryStep {
  doc: string,
  selection: SelectionPosition | null
}

const stepEq = (left: HistoryStep, right: HistoryStep) => {
  return left.doc === right.doc
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

