<template>
  <div class="toc-block">
    <div class="toc-header">目录</div>
    <div class="toc-item"
      v-for="(item, index) in list"
      @click="clickHandler(item)"
      :style="{paddingLeft: (item.level - 1) * 18 + 'px'}"
      :key="index">
        {{ item.text }}
    </div>
  </div>
</template>

<script lang="ts" setup>
import { type ShallowRef, inject, onBeforeUnmount, onMounted, ref } from 'vue';
import { BlockTree, rootSymbol } from '../../../models/BlockTree';
import { BlockModel } from '../../../models/block';
import { toText } from '@writing/utils/delta';

const rootValue = inject<ShallowRef<BlockTree>>(rootSymbol);

const HeadingTypes = {
  'heading1': 1,
  'heading2': 2,
  'heading3': 3,
  'heading4': 4,
  'heading5': 5,
  'heading6': 6
};

const list = ref<{ id: string, text: string, level: number }[]>();

const blockToText = (block: BlockModel) => {
  // 先简单处理纯文本内容
  return toText(block.data?.ops || []) || '标题';
};

const getTocTree = () => {
  rootValue.value.walkTree((path, block) => {
    if (HeadingTypes[block.type]) {
      list.value.push({
        id: block.id,
        level: HeadingTypes[block.type],
        text: blockToText(block)
      });
    }
  });
};

const changeHandler = () => {
  list.value = [];
  getTocTree();
};

const clickHandler = (item: { id: string }) => {
  document.querySelector(`[data-block-id=${JSON.stringify(item.id)}]`).scrollIntoView({
    behavior: 'smooth'
  });
};

onMounted(() => {
  changeHandler();
  rootValue.value.on('change', changeHandler);
});

onBeforeUnmount(() => {
  rootValue.value.off('change', changeHandler);
});
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