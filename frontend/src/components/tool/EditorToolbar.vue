<template>
  <ul class="editor-toolbar" :style="style" v-show="style">
    <li class="toolbar-item"
      :class="{ actived: state.bold }"
      @pointerdown.capture="clickHandler('bold')">
      B
    </li>
    <li class="toolbar-item"
      :class="{ actived: state.italic }">
      I
    </li>
    <li class="toolbar-item"
      :class="{ actived: state.link }">
      Link
    </li>
    <li class="toolbar-item"
      :class="{ actived: state.code }">
      Code
    </li>
  </ul>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue'
import type { SelectionState } from '@/hooks/selection';
import { createLogger } from '@/utils/logger';
import { getBlockByPath, type BlockModel } from '@/models/block';

const logger = createLogger('EditorToolbar')

const props = defineProps<{
  root: BlockModel,
  selection: SelectionState
}>()

const state = ref({
  bold: false,
  italic: false,
  link: false,
  code: false
})

const style = computed(() => {
  if (!props.selection.rect) return null
  logger.i('style', props.selection.rect.left + props.selection.rect.width / 2)
  return {
    top: (props.selection.rect.top - 42) + 'px',
    left: (props.selection.rect.left) + 'px'
  }
})

const clickHandler = (format: string) => {
  logger.i('clickHandler', JSON.parse(JSON.stringify(props.selection)))
  const { from, to } = props.selection.selection!
  const fromBlock = getBlockByPath(props.root, from.path)
  const toBlock = getBlockByPath(props.root, to.path)
  logger.i('clickHandler', fromBlock, toBlock)
  if (fromBlock === toBlock) {
    const el = document.querySelector(`[data-block-id=${JSON.stringify(fromBlock.id)}] [data-focusable]`)
    logger.i('clickHandler', el)
    el?.dispatchEvent(new CustomEvent('format', {
      bubbles: true,
      detail: {
        range: { index: from.offset, length: to.offset - from.offset },
        formats: { bold: true }
      }
    }))
  }
}
</script>

<style lang="less" scoped>
.editor-toolbar {
  display: flex;
  color: #fff;
  font-size: 16px;
  background: #000;
  list-style: none;
  padding: 0;
  margin: 0;
  transition: top .1s, left .1s;
  position: absolute;
  // transform: translateX(-50%);
  .toolbar-item {
    height: 36px;
    line-height: 36px;
    padding: 0 8px;
    box-sizing: border-box;
    min-width: 36px;
    text-align: center;
    cursor: pointer;
    transition: background .2s;
    &:hover {
      background: #444;
    }
  }
}
</style>