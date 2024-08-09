<template>
  <div class="toc-block">
    <div class="toc-header">目录</div>
    <div class="toc-item"
      v-for="(item, index) in toc"
      @click="clickHandler(item)"
      :style="{paddingLeft: (item.level - 1) * 18 + 'px'}"
      :key="index">
        {{ item.text }}
    </div>
  </div>
</template>

<script lang="ts" setup>
import { EditorView } from 'prosemirror-view';
import type { TocItem } from '@/editor/plugins/toc';

const props = defineProps<{ view: EditorView, toc: TocItem[] }>()

const clickHandler = (item: TocItem) => {
  const dom = props.view.nodeDOM(item.pos)
  if (dom && (dom instanceof HTMLElement)) {
    dom.scrollIntoView({ behavior: 'smooth' })
  }
}

</script>

<style lang="less" scoped>
.toc-block {
  .toc-header {
    padding: 6px 0;
    font-size: 18px;
    font-weight: bold;
  }
  .toc-item {
    padding: 6px 0;
    cursor: pointer;
    transition: background .2s;
    border-radius: 4px;
    &:hover {
      background: #eee;
    }
  }
}
</style>