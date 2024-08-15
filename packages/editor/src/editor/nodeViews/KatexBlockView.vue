<template>
  <div class="katex-block-view" data-prosemirror-dom :data-katex-source="node.attrs.source" :class="{editable: editable}">
    <el-popover width="auto" trigger="click" :disabled="!editable">
      <template #reference>
        <div class="katex-container"
          :class="{'is-empty': !node.attrs.source}"
          ref="viewEl"
        >{{ editable ? '点击填写公式' : '' }}</div>
      </template>
      <template #default>
        <div class="katex-input-content">
          <h5 class="input-title">请输入公式</h5>
          <textarea name="katex" cols="30" rows="5"
            class="katex-source"
            placeholder="e=mc^2"
            :value="node.attrs.source || ''"
            spellcheck="false"
            @input="updateData({ source: ($event.target as HTMLTextAreaElement).value })"
          ></textarea>
          <a href="https://katex.org/docs/supported"
            class="intro"
            target="_blank"
            referrerpolicy="strict-origin-when-cross-origin"
            rel="noopener"
          >Supported Functions</a>
      </div>
      </template>
    </el-popover>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue';
import { ElPopover } from 'element-plus';
import { type VueNodeViewProps } from '../plugins/vueNodeViews';
import { type Attrs } from 'prosemirror-model';

const props = defineProps<VueNodeViewProps>()
const emits = defineEmits<{
  updateAttrs: [Attrs]
}>()

const viewEl = ref<HTMLElement>();

const editable = computed(() => props.view?.editable === undefined || props.view.editable === true)

const updateData = (val: Partial<{ source: string }>) => {
  emits('updateAttrs', { source: val.source || '' })
};

watch(
  () => props.node.attrs.source,
  async (val) => {
    console.log('watch', val)
    if (!val) return;
    if (!viewEl.value) {
      await nextTick();
    }
    const { default: katex } = await import('katex')
    katex.render(val, viewEl.value!, {
      throwOnError: false,
      output: 'mathml'
    });
  },
  {
    immediate: true
  }
);

</script>

<style lang="less" scoped>
.katex-container {
  text-align: center;
  padding: 16px 0;
  cursor: pointer;
  &.is-empty {
    color: #bbb;
  }
  &.editable:hover {
    background: rgba(0, 0, 0, .1);
  }
}
.katex-input-content {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}
.input-title {
  margin: 0 auto 6px 0;
  color: #000;
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