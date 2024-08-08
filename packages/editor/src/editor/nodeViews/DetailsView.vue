<template>
  <div class="details-node-view" data-prosemirror-dom :class="{close: !node.attrs.open}">
    <span class="material-symbols-outlined expand-icon"
      @click.prevent="toggleHandler"
      contenteditable="false"
      data-prosemirror-ignore-selection-mutation
    >arrow_right</span>
    <!-- 此处不可直接使用 details element, 因为里面的 summary 有点击切换的效果，所以会导致 summary 无法编辑 -->
    <div class="details" data-prosemirror-content-dom></div>
  </div>
</template>

<script lang="ts" setup>
import type { VueNodeViewProps } from '../plugins/vueNodeViews';
import type { Attrs } from 'prosemirror-model';

const props = defineProps<VueNodeViewProps>()
const emits = defineEmits<{
  updateAttrs: [Attrs]
}>()

const toggleHandler = () => {
  emits('updateAttrs', { open: !props.node.attrs.open })
}
</script>

<style lang="less" scoped>
.details-node-view {
  display: flex;
  .expand-icon {
    cursor: pointer;
    width: 24px;
    height: 24px;
    transition: transform .2s;
    transform: rotate(90deg);
  }
  .details {
    flex: 1;
  }
  &.close {
    .expand-icon {
      transform: rotate(0);
    }
    .details > :not(summary) {
      display: none
    }
  }
}
</style>