<template>
  <div class="column-container" ref="container">
    <div class="column-left" :style="{ width: leftWidth + '%' }">
      <slot name="side"></slot>
    </div>
    <div class="column-divider" @pointerdown="pointerdownHandler"
      @pointermove="pointermoveHandler"
      @pointerup="pointerupHandler"></div>
    <div class="column-right">
      <slot></slot>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { debounce } from '@/utils/utils';
import { ref } from 'vue';

const leftWidth = defineModel<number>()

const emtis = defineEmits<{
  change: [value: number]
}>()

const container = ref<HTMLElement>()

const changeHandler = debounce((value: number) => {
  emtis('change', value)
})

let dragging = false
const pointerdownHandler = (event: PointerEvent) => {
  (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId)
  dragging = true
}

const pointermoveHandler = (event: PointerEvent) => {
  if (!dragging) return;
  const { width } = container.value!.getBoundingClientRect()

  leftWidth.value = event.clientX / width * 100
  changeHandler(leftWidth.value)
}

const pointerupHandler = (event: PointerEvent) => {
  dragging = false;
  (event.target as HTMLElement).releasePointerCapture(event.pointerId)
}
</script>

<style lang="less" scoped>
.column-container {
  width: 100%;
  height: 100%;
  overflow: auto;
  display: flex;
  .column-left {
    height: 100%;
  }
  .column-divider {
    height: 100%;
    width: 4px;
    background: rgba(220, 220, 220, .8);
    cursor: ew-resize;
  }
  .column-right {
    flex: 1;
    height: 100%;
    overflow: auto;
  }
}
</style>