<template>
  <div class="katex-view" data-prosemirror-dom>
    <el-popover content="请输入" width="auto" :disabled="readonly">
      <template #reference>
        <div class="katex-view"
          :class="{'is-empty': !node.attrs.source}"
          ref="viewEl">{{ readonly ? '' : '点击填写公式' }}</div>
      </template>
      <template #default>
        <div class="katex-input-content">
          <textarea name="katex" cols="30" rows="5"
            class="katex-source"
            placeholder="|x| = \begin{cases}             
    x, &\quad x \geq 0 \\           
  -x, &\quad x < 0             
  \end{cases}"
            :value="node.attrs.source || ''"
            @input="updateData({ source: ($event.target as HTMLTextAreaElement).value })"></textarea>
          <a href="https://katex.org/docs/supported"
          class="intro"
          target="_blank"
          referrerpolicy="strict-origin-when-cross-origin"
          rel="noopener">Supported Functions</a>
      </div>
      </template>
    </el-popover>
  </div>
</template>

<script setup lang="ts">
import { nextTick, ref, watch } from 'vue';
import { ElPopover } from 'element-plus';
import katex from 'katex';
import { type VueNodeViewProps } from '../plugins/vueNodeViews';
import { type Attrs } from 'prosemirror-model';

const props = defineProps<VueNodeViewProps>()
const emits = defineEmits<{
  updateAttrs: [Attrs]
}>()

const viewEl = ref<HTMLElement>();

const readonly = false

const updateData = (val: Partial<{ source: string }>) => {
  emits('updateAttrs', { source: val.source || '' })
};

watch(
  () => props.node.attrs.source,
  async (val) => {
    if (!val) return;
    if (!viewEl.value) {
      await nextTick();
    }
    console.log(val)
    katex.render('e=mc^2', viewEl.value, {
      throwOnError: false
    });
  },
  {
    immediate: true
  }
);

</script>

<style lang="less" scoped>
.katex-view {
  text-align: center;
  padding: 16px 0;
  &.is-empty {
    color: #bbb;
  }
}
.katex-input-content {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}
.katex-source {
  font-family: 'Courier New', Courier, monospace;
  border: none;
  resize: none;
  outline: none;
    &::-webkit-scrollbar {
      border: none;
      width: 4px;
    }
    &::-webkit-scrollbar-thumb {
      background-color: #ddd;
      border-radius: 100px;
    }
}
</style>