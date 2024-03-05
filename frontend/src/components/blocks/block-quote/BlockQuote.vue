<template>
  <blockquote class="block-quote-block" ref="el">
    <div v-for="(child, index) in block.children"
      :key="child.id + child.type"
      :data-block-id="child.id"
      class="block-quote-content">
      <block-editor
        :model-value="child"
        :index="index"
        :parent="parent"
        :path="[...path, index]"
        @update:modelValue="updateBlock(index, $event)"
        @add="addBlock(index, $event)"
        @remove="removeBlock(index)"
      ></block-editor>
    </div>
  </blockquote>
</template>

<script lang="ts" setup>
import { type BlockModel } from '@/models/block';
import BlockEditor from '@/components/BlockEditor.vue';
import { watch } from 'vue';
import { useOperator } from '@/hooks/operator';

const block = defineModel<BlockModel>({ required: true })

const props = defineProps<{
  index: number,
  parent?: BlockModel,
  path: number[],
}>()

const emits = defineEmits<{
  added: [{ block: BlockModel, index: number, parent?: BlockModel }],
  updated: [{ oldBlock: BlockModel, block: BlockModel, index: number, parent?: BlockModel }],
  removed: [{ removed: BlockModel, index: number, parent?: BlockModel }],
  change: [BlockModel],
  'update:modelValue': [BlockModel],
  remove: [],
}>()

const { addBlock, updateBlock, removeBlock } = useOperator(props)

if (!block.value.children?.length) {
  addBlock(0, {
    type: 'text',
    id: Math.random().toString(16).substring(2)
  })
}

watch(() => block.value.children?.length ?? 0, (newVal, oldVal) => {
  if (oldVal && !newVal) {
    // 所有的子节点已删除，把当前节点也删除
    emits('remove')
  }
})

</script>

<style lang="less" scoped>
blockquote.block-quote-block {
  margin: 0;
  border-left: 4px solid #dfe2e5;
  padding: 3px 0 3px 16px;
}
</style>