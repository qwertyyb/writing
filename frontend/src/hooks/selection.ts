import { createLogger } from "@/utils/logger"
import { type Ref, onMounted } from "vue"

const logger = createLogger('selection')

export const useSelection = ({ el }: {
  el: Ref<HTMLElement | undefined>
}) => {

  let isMultiSelect = false

  let anchorNodeBlockId: string | null = null
  let anchorNode: Node | null = null
  let focusNode: Node | null = null
  let focusOffset = 0
  let anchorOffset = 0

  const getBlockIdFromPoint = (x: number, y: number) => {
    const element = document.elementFromPoint(x, y) as HTMLElement
    if (element.dataset?.blockId) return element.dataset.blockId
    const closestBlockEl = element.closest<HTMLElement>('[data-block-id]')
    return closestBlockEl?.dataset!.blockId
  }

  const getBlockIdFromNode = (node: Node): string | null => {
    let blockId = (node as HTMLElement)?.dataset?.blockId
    if (blockId) return blockId
    blockId = node?.parentElement?.dataset.blockId
    if (blockId) return blockId
    return node?.parentElement?.closest<HTMLElement>('[data-block-id]')?.dataset.blockId ?? null
  }

  const resetContenteditable = () => {
    isMultiSelect = false
    el.value!.querySelectorAll<HTMLElement>('[data-origin-contenteditable]')
      .forEach(dom => {
        dom.contentEditable = dom.dataset.originContenteditable as string
        delete dom.dataset.originContenteditable
      })
  }

  onMounted(() => {
    document.addEventListener('selectionchange', () => {
      const selection = window.getSelection()
      if (!selection) return
      if (selection.anchorNode) {
        anchorNode = selection.anchorNode
        anchorOffset = selection.anchorOffset
        focusNode = selection.focusNode
        focusOffset = selection.focusOffset
        anchorNodeBlockId = getBlockIdFromNode(selection.anchorNode)
      }
      logger.i('selection', selection, selection.anchorNode, selection.focusNode)

      if (selection.type === 'Caret') {
        resetContenteditable()
        return
      }
    })
  })

  const pointermoveHandler = (event: PointerEvent) => {
    if (event.buttons === 1 && !isMultiSelect) {
      const curBlockId = getBlockIdFromPoint(event.clientX, event.clientY)
      if (curBlockId !== anchorNodeBlockId) {
        // 鼠标移出了当前的块范围，设置为跨块多选模式
        isMultiSelect = true
        el.value!.querySelectorAll<HTMLElement>('[contenteditable="false"]')
          .forEach(dom => {
            dom.dataset.originContenteditable = dom.contentEditable
            dom.removeAttribute('contenteditable')
          })
        const sel = window.getSelection()
        if (!sel) return
  
        sel.setBaseAndExtent(anchorNode!, anchorOffset, focusNode!, focusOffset)
        logger.i('pointermove', window.getSelection(), anchorNode, focusNode)
        return
      }
    }
  }
  return { pointermoveHandler }
}