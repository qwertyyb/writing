<template>
  <component :is="tag" class="content-resizer" ref="containerEl">
    <slot></slot>
    <div class="resizer-left"
      @pointerdown="pointerdownHandler('left', $event)"
      @pointermove="pointermoveHandler('left', $event)"
      @pointerup="pointerupHandler($event)"></div>
    <div class="resizer-right"
      @pointerdown="pointerdownHandler('right', $event)"
      @pointermove="pointermoveHandler('right', $event)"
      @pointerup="pointerupHandler($event)"></div>
  </component>
</template>

<script lang="ts" setup>
import { ref } from 'vue';

const props = withDefaults(defineProps<{ anchor: 'left' | 'center' | 'right', size: number, tag?: string, maxWidth: number }>(), { tag: 'div' })
const emits = defineEmits<{ change: [number] }>()

const containerEl = ref<HTMLDivElement>()

const startPos = { x: 0, y: 0, width: 0, height: 0, size: 0 };
const pointerdownHandler = (direction: 'left' | 'right', event: PointerEvent) => {
  startPos.x = event.clientX;
  startPos.width = containerEl.value!.getBoundingClientRect().width ?? 0;
  (event.target as HTMLElement).setPointerCapture(event.pointerId);
};
const pointermoveHandler = (direction: 'left' | 'right', event: PointerEvent) => {
  if (event.buttons !== 1) return;
  let dwidth = direction === 'left' ? startPos.x - event.clientX : event.clientX - startPos.x;
  if (props.anchor === 'center') {
    dwidth *= 2;
  }
  const size = Math.round((startPos.width + dwidth) / props.maxWidth * 100)
  startPos.size = size
  emits('change', startPos.size)
};
const pointerupHandler = (event: PointerEvent) => {
  (event.target as HTMLElement).releasePointerCapture(event.pointerId);
  emits('change', startPos.size)
};

</script>

<style lang="less" scoped>
.content-resizer {
  position: relative;
  .resizer-left, .resizer-right {
    position: absolute;
    top: 0;
    bottom: 0;
    width: 4px;
    cursor: ew-resize;
    transition: background .3s;
    &:hover {
      background: rgb(1, 152, 239);
    }
  }
  .resizer-left {
    left: -2px;
  }
  .resizer-right {
    right: -2px;
  }
}
</style>