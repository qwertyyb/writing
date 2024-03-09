import { onBeforeUnmount, onMounted, ref } from "vue"

export const usePointer = () => {
  const state = ref({
    pressed: false
  })
  const mousedownHandler = () => {
    state.value.pressed = true
  }
  const mouseupHandler = () => {
    setTimeout(() => {
      state.value.pressed = false
    })
  }

  onMounted(() => {
    document.addEventListener('pointerdown', mousedownHandler, { passive: true, capture: true })
    document.addEventListener('pointerup', mouseupHandler, { passive: true, capture: true })
  })
  onBeforeUnmount(() => {
    document.removeEventListener('pointerdown', mousedownHandler, { capture: true })
    document.removeEventListener('pointerup', mouseupHandler, { capture: true })
  })

  return { state }
}