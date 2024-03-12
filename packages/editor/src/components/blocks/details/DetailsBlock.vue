<template>
  <div class="details-block">
    <div class="details-summary">
      <span class="material-symbols-outlined summary-icon"
        @click="contentVisible = !contentVisible"
        :class="{ expanded: contentVisible }">arrow_right</span>
      <text-block :model-value="block.data.summary"
        v-if="block.data.summary"
        @update:model-value="updateSummary"
        @remove="$emit('remove')"
        @add="$emit('add')"
        class="details-summary-input"></text-block>
    </div>
    <div class="details-content" v-if="contentVisible">
      <block-list-editor
        v-model="block.children"
        @add="addBlock"
        @update="updateBlock"
        @remove="removeBlock"
        :path="path"
        :index="index"></block-list-editor>
    </div>
  </div>
</template>

<script lang="ts" setup>
import BlockListEditor from '../../BlockListEditor.vue';
import TextBlock from '../../blocks/TextBlock.vue';
import { type BlockModel, createBlock } from '../../../models/block';
import { watch, ref } from 'vue';
import { useOperator } from '../../../hooks/operator';

const block = defineModel<BlockModel>({ required: true });

const props = defineProps<{
  index: number,
  parent?: BlockModel,
  path: number[],
}>();

const emits = defineEmits<{
  added: [{ block: BlockModel, index: number, parent?: BlockModel }],
  updated: [{ oldBlock: BlockModel, block: BlockModel, index: number, parent?: BlockModel }],
  removed: [{ removed: BlockModel, index: number, parent?: BlockModel }],
  change: [BlockModel],
  'update:modelValue': [BlockModel],
  remove: [],
  add: [],
}>();

const { addBlock, updateBlock, removeBlock } = useOperator(props);

watch(() => block.value.children?.length ?? 0, (newVal, oldVal) => {
  if (oldVal && !newVal) {
    // 所有的子节点已删除，把当前节点也删除
    emits('remove');
  }
});

if (!block.value.data.summary || !block.value.children.length) {
  let value = {
    ...block.value,
  };
  if (!block.value.data.summary) {
    value.data = {
      summary: createBlock({
        type: 'text',
        data: {
          ops: []
        }
      })
    };
  }
  if (!block.value.children.length) {
    value.children = [
      createBlock({ type: 'text', data: { ops: [] }})
    ];
  }
  block.value = { ...value };
}

const contentVisible = ref(false);

const updateSummary = (summary: BlockModel) => {
  block.value = { ...block.value, data: { ...block.value.data, summary } };
};

</script>

<style lang="less" scoped>
.details-block {
  .details-summary {
    display: flex;
    align-items: center;
    .details-summary-input {
      flex: 1;
    }
  }
  .summary-icon {
    cursor: pointer;
    transition: transform .2s;
    width: 24px;
    height: 24px;
    &.expanded {
      transform: rotateZ(90deg)
    }
  }
  .details-content {
    padding-left: 24px;
  }
}
</style>