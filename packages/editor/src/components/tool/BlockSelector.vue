<template>
  <div class="block-selector" ref="el" :style="floatingStyles">
    <ul class="block-selector-list">
      <li class="block-selector-item"
        @click="$emit('confirm', block)"
        :class="{ selected: index === selectedIndex }"
        v-for="(block, index) in visibleBlocks"
        :key="block.identifier">
        <span class="material-symbols-outlined block-icon">
        {{ block.icon }}
        </span>
        <span class="block-label">
          {{ block.label }}
        </span>
      </li>
      <li class="block-selector-item" v-if="visibleBlocks.length <= 0">未找到结果</li>
    </ul>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref, watch, nextTick, shallowRef } from 'vue';
import { VirtualElement, useFloating, shift, flip } from '@floating-ui/vue';
import allBlocks from '../blocks';
import { createLogger } from '@writing/utils/logger';

const logger = createLogger('BlockSelector')

const blocks = allBlocks.filter(item => item.visibleInSelector !== false)

const props = defineProps<{
  rect: { top: number, left: number, width: number, height: number },
  keyword: string
}>()

const emits = defineEmits<{
  confirm: [command: any],
  close: []
}>()

const reference = shallowRef<VirtualElement>({
  getBoundingClientRect() {
    const { top, left, width, height } = props.rect
    return {
      ...props.rect,
      x: left, y: top,
      right: left + width,
      bottom: top + height
    }
  },
  contextElement: document.body
})
const el = ref<HTMLDivElement>()

watch(() => props.rect, () => {
  reference.value = {
    getBoundingClientRect() {
      const { top, left, width, height } = props.rect
      return {
        ...props.rect,
        x: left, y: top,
        right: left + width,
        bottom: top + height
      }
    },
    contextElement: document.body
  }
})

const { floatingStyles, update: updatePopover } = useFloating(reference, el, {
  placement: 'bottom-start',
  strategy: 'absolute',
  middleware: [flip({ mainAxis: true, crossAxis: false, }), shift()]
})

const selectedIndex = ref(0)
let emptyTimes = 0

const visibleBlocks = computed(() => {
  nextTick(() => {
    updatePopover()
  })
  if (!props.keyword) return blocks
  return blocks.filter(block => block.identifier.includes(props.keyword))
})

watch(() => props.keyword, () => {
  selectedIndex.value = 0
  if (visibleBlocks.value.length) {
    emptyTimes = 0
  } else {
    emptyTimes += 1
  }
  if (emptyTimes >= 5) {
    emits('close')
  }
})

watch(selectedIndex, async () => {
  await nextTick()
  el.value?.querySelector<HTMLElement>('.block-selector-item.selected')?.scrollIntoView({
    block: 'nearest'
  })
})

defineExpose({
  resetSelected() { selectedIndex.value = 0 },
  selectNext() {
    if (!visibleBlocks.value.length) return
    selectedIndex.value = (selectedIndex.value + 1) % visibleBlocks.value.length
  },
  selectPrev() {
    if (!visibleBlocks.value.length) return
    selectedIndex.value = (selectedIndex.value - 1 + visibleBlocks.value.length) % visibleBlocks.value.length
  },
  selected() {
    logger.i('visibleBlocks', visibleBlocks.value, selectedIndex.value, props)
    return visibleBlocks.value[selectedIndex.value]
  }
})

</script>

<style lang="less" scoped>
.block-selector {
  box-shadow: 0 3px 15px -3px rgba(13,20,33,.13);
  border: 1px solid #e8e8eb;
  border-radius: 6px;
  padding: 4px;
  background: #fff;
  color: rgba(100, 100, 100, 1);
  min-width: 200px;
  z-index: 99;
  .block-selector-list {
    list-style: none;
    margin: 6px 0;
    padding: 0;
    max-height: 240px;
    overflow: auto;
    &::-webkit-scrollbar {
      border: none;
      width: 4px;
    }
    &::-webkit-scrollbar-thumb {
      background-color: #ddd;
      border-radius: 100px;
    }
  }
  .block-selector-item {
    padding: 8px 8px;
    font-size: 14px;
    border-radius: 6px;
    cursor: pointer;
    display: flex;
    align-items: center;
    &:hover {
      background: rgba(236, 237, 240, 0.8)
    }
    &.selected {
      background: rgba(241, 238, 238, 0.8)
    }
    .block-icon {
      width: 24px;
      height: 24px;
      line-height: 24px;
      text-align: center;
      font-size: 20px;
      margin-right: 6px;
    }
  }
}
</style>../blocks