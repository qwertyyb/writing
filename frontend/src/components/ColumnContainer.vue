<template>
  <div class="column-container" ref="container">
    <transition enter-active-class="animate__animated animate__slideInLeft"
      leave-active-class="animate__animated animate__slideOutLeft"
      appear-active-class="animate__animated animate__slideInLeft">
      <div class="column-left-divider"
        v-if="!sideHidden"
        :style="{ width: leftWidth + '%' }">
        <div class="column-left">
          <slot name="side"></slot>
        </div>
        <div class="column-divider" @pointerdown="pointerdownHandler"
          @pointermove="pointermoveHandler"
          @pointerup="pointerupHandler"></div>
      </div>
    </transition>
    <div class="column-right">
      <span class="material-symbols-outlined open-side-icon"
        @click="$emit('openSide')"
        v-if="sideHidden" title="打开侧边栏">start</span>
      <slot></slot>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { debounce } from '@/utils/utils';
import { ref } from 'vue';

const leftWidth = defineModel<number>()

defineProps<{
  sideHidden: boolean
}>()

const emtis = defineEmits<{
  change: [value: number],
  openSide: []
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
  .column-left-divider {
    height: 100%;
    display: flex;
  }
  .column-left {
    height: 100%;
    flex: 1;
  }
  .column-divider {
    height: 100%;
    width: 4px;
    background: rgba(220, 220, 220, .8);
    cursor: ew-resize;
    flex-shrink: 0;
  }
  .column-right {
    flex: 1;
    height: 100%;
    overflow: auto;
    position: relative;
    left: 0;
    .open-side-icon {
      position: absolute;
      left: 0;
      top: 20px;
      padding: 0 10px;
      cursor: pointer;
      border-radius: 4px;
      opacity: 0;
      transition: background .3s, opacity 0.3s;;
      &:hover {
        background: #eee;
        opacity: 1;
      }
    }
  }
}
</style>