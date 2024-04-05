<template>
  <div class="katex-block">
    <el-popover content="请输入" width="auto" :disabled="readonly">
      <template #reference>
        <div class="katex-view"
          :class="{'is-empty': !block.data.source}"
          ref="viewEl">{{ readonly ? '' : '点击填写公式' }}</div>
      </template>
      <template #default>
        <textarea name="katex" cols="30" rows="5"
          placeholder="|x| = \begin{cases}             
  x, &\quad x \geq 0 \\           
 -x, &\quad x < 0             
\end{cases}"
          :value="block.data.source || ''"
          @input="updateData({ source: ($event.target as HTMLTextAreaElement).value })"></textarea>
      </template>
    </el-popover>
  </div>
</template>

<script setup lang="ts">
import { nextTick, ref, watch } from 'vue';
import { type BlockModel } from '../../../models/block';
import { ElPopover } from 'element-plus';
import { useMode } from '../../../hooks/mode';

declare global {
  interface Window {
    katex: any
  }
}

const block = defineModel<BlockModel>();

const { readonly } = useMode();

const viewEl = ref<HTMLElement>();

const updateData = (val: Partial<{ source: string }>) => {
  block.value = {
    ...block.value,
    data: {
      ...block.value.data, ...val
    }
  };
};

watch(
  () => block.value.data?.source,
  async (val) => {
    if (!val) return;
    if (!viewEl.value) {
      await nextTick();
    }
    window.katex.render(val, viewEl.value, {
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
  padding: 10px 0;
  &.is-empty {
    color: #bbb;
  }
}
</style>