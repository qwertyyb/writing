<template>
  <div class="content-resizer" ref="containerEl">
    <slot></slot>
    <div class="resizer-left"
      @pointerdown="pointerdownHandler('left', $event)"
      @pointermove="pointermoveHandler('left', $event)"
      @pointerup="pointerupHandler($event)"></div>
    <div class="resizer-right"
      @pointerdown="pointerdownHandler('right', $event)"
      @pointermove="pointermoveHandler('right', $event)"
      @pointerup="pointerupHandler($event)"></div>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue';


const containerEl = ref<HTMLDivElement>()

const startPos = { x: 0, y: 0, width: 0, height: 0 };
const pointerdownHandler = (direction: 'left' | 'right', event: PointerEvent) => {
  startPos.x = event.clientX;
  startPos.width = imageEl.value?.$el.getBoundingClientRect().width ?? 0;
  (event.target as HTMLElement).setPointerCapture(event.pointerId);
};
const pointermoveHandler = (direction: 'left' | 'right', event: PointerEvent) => {
  if (event.buttons !== 1) return;
  const pwidth = containerEl.value!.getBoundingClientRect().width;
  let dwidth = direction === 'left' ? startPos.x - event.clientX : event.clientX - startPos.x;
  if (data.value.align === ImageAlign.Center) {
    dwidth *= 2;
  }
  update({ 'size': Math.round((startPos.width + dwidth) / pwidth * 100) });
};
const pointerupHandler = (event: PointerEvent) => {
  (event.target as HTMLElement).releasePointerCapture(event.pointerId);
};

</script>

<style lang="less" scoped>
.content-resizer {
  position: relative;
}
</style>