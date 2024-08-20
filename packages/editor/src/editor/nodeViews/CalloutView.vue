<template>
  <div class="callout-view" :class="{editable}">
    <el-popover trigger="click" width="auto"
      :disabled="!editable"
      transition="none"
      :hide-after="0"
      v-model:visible="visible">
      <template #reference>
        <div class="callout-icon">{{ node.attrs.icon }}</div>
      </template>
      <div class="emoji-selector-panel">
        <emoji-panel search @change="update({ icon: $event })" v-if="visible"></emoji-panel>
      </div>
    </el-popover>
    <div class="callout-content" data-prosemirror-content-dom>
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { VueNodeViewProps } from '../plugins/vueNodeViews';
import type { Attrs } from 'prosemirror-model';
import { computed, ref } from 'vue';
import EmojiPanel from '../components/EmojiPanel.vue';
import { ElPopover } from 'element-plus';

const props = defineProps<VueNodeViewProps>()
const emits = defineEmits<{
  updateAttrs: [Attrs]
}>()

const visible = ref(false)

const editable = computed(() => props.view?.editable !== false)

const update = (attrs: { icon: string }) => {
  emits('updateAttrs', attrs )
  visible.value = false
}
</script>

<style lang="less" scoped>
.callout-view {
  display: flex;
  padding: 16px 16px 16px 12px;
  background: rgb(241, 241, 239);
  border-radius: 4px;
  align-items: first baseline;
  &.editable .callout-icon {
    cursor: pointer;
    &:hover {
      background: #dedede;
    }
    &:active {
      transform: scale(1.2);
    }
  }
  .callout-icon {
    font-size: 22px;
    transition: background .2s, transform .2s;
    height: 32px;
    width: 32px;
    line-height: 32px;
    text-align: center;
    border-radius: 4px;
  }
  .callout-content {
    margin-left: 8px;
    flex: 1;
  }
}
</style>