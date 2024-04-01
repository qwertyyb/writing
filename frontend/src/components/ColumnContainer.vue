<template>
  <div class="column-container" ref="container">
    <transition enter-active-class="animate__animated animate__slideInLeft"
      leave-active-class="animate__animated animate__slideOutLeft">
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
        v-if="sideHidden" title="打开侧边栏">menu</span>
      <slot></slot>
    </div>
    <div class="menu-mask" @click="$emit('closeSide')" v-if="!sideHidden"></div>
  </div>
</template>

<script lang="ts" setup>
import { debounce } from '@/utils/utils';
import { ref } from 'vue';

const MinSideWidth = 200

const leftWidth = defineModel<number>()

defineProps<{
  sideHidden: boolean
}>()

const emtis = defineEmits<{
  change: [value: number],
  openSide: [],
  closeSide: [],
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
  const maxWidth = width * 0.9
  leftWidth.value = Math.min(Math.max(MinSideWidth, event.clientX), maxWidth) / width * 100
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
  position: relative;
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
      left: 16px;
      top: 20px;
      cursor: pointer;
      border-radius: 4px;
      transition: background .3s, opacity 0.3s;
      z-index: 1;
      &:hover {
        background: #eee;
        opacity: 1;
      }
    }
  }
}

@media screen and (max-width: 540px) {
  .menu-mask {
    content: " ";
    display: block;
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, .4);
    z-index: 10;
    backdrop-filter: blur(4px);
  }
  .column-left-divider {
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    z-index: 100;
    background: #fff;
    width: 80vw !important;
  }
}
</style>