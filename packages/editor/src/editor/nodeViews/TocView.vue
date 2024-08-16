<template>
  <div class="toc-view" data-prosemirror-dom>
    <div class="toc-header">目录</div>
    <div class="toc-item"
      v-for="(item, index) in toc"
      @click="clickHandler(item)"
      :style="{paddingLeft: (item.level + 1) * 2 + 'em'}"
      :key="index"
    >
      {{ item.text }}
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import type { VueNodeViewProps } from '../plugins/vueNodeViews';

const props = defineProps<VueNodeViewProps>()

interface TocItem {
  text: string
  level: number
  pos: number
}

const toc = computed(() => {
  if (!props.view) return []
  const doc = props.view.state.doc
  const results: TocItem[] = []
  doc.descendants((node, pos) => {
    if (node.type.name === 'heading') {
      const $pos = doc.resolve(pos)
      results.push({ text: node.textContent, level: $pos.depth, pos: pos })
      return false
    }
  })
  return results
})

const clickHandler = (item: TocItem) => {
  const dom = props.view!.nodeDOM(item.pos)
  if (dom && (dom instanceof HTMLElement)) {
    dom.scrollIntoView({ behavior: 'smooth' })
  }
}

</script>

<style lang="less" scoped>
.toc-view {
  opacity: 0.7;
  cursor: pointer;
  border-radius: 4px;
  &.ProseMirror-selectednode {
    background: rgba(87, 142, 139, 0.2);
  }
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
    font-weight: bold;
    &:hover {
      background: #eee;
    }
  }
}
</style>