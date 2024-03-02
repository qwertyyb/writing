import { Mode } from "@/components/schema"
import { ref, type ComputedRef, type Ref } from "vue"

export const useBlockTool = (options: { el: Ref<HTMLElement | undefined>, mode: ComputedRef<Mode> }) => {
  const state = ref({
    top: 0, left: 0,
    visible: false
  })
  const hide = () => { state.value.visible = false }

  const pointermoveHandler = (event: PointerEvent) => {
    if (options.mode.value === Mode.Readonly) {
      return hide()
    }
    const blockEl = (event.target as HTMLElement).closest('[data-block-id]')
    if (!blockEl) return hide()
    const blockContentEl = blockEl.querySelector<HTMLDivElement>('.block-content')
    if (!blockContentEl) return hide()
    const { left } = blockEl.getBoundingClientRect()
    const { top, height } = blockContentEl.getBoundingClientRect()
    const { top: pTop, left: pLeft } = options.el.value!.getBoundingClientRect()
    const tTop = top - pTop + (height - 24) / 2
    const tLeft = left - pLeft - 28
    state.value = {
      top: tTop,
      left: tLeft,
      visible: true
    }
  }
  return { state, pointermoveHandler }
}