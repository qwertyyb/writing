import { sizeChange, ScreenSize } from "@/utils/resize"
import { onBeforeUnmount, onMounted, ref } from "vue"

export const useSize = () => {
  const screenSize = ref<ScreenSize>(ScreenSize.Large)
  let unsize: (() => void) | null
  onMounted(() => {
    unsize = sizeChange((size) => {
      screenSize.value = size
    })
  })
  onBeforeUnmount(() => {
    unsize?.()
  })
  return { size: screenSize }
}