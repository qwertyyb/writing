<template>
  <component ref="el" class="list-block" data-block-node="no-leaf" :is="tag">
    <li v-for="(child, index) in block.children"
      :key="child.id + child.type"
      class="list-block-item">
      <block-editor
        :model-value="child"
        :index="index"
        :parent="parent"
        :ref="el => setBlockRef(child.id, el as any)"
        @update:modelValue="updateBlock($event, child, index)"
        @add="addBlock($event, child, index)"
        @remove="removeBlock(child, index)"
      ></block-editor>
    </li>
  </component>
</template>

<script lang="ts" setup>
import { type BlockModel, BlockSaveType } from '@/models/block';
import useBlockOperate from '@/components/block-operate';
import BlockEditor from '@/components/BlockEditor.vue';

const block = defineModel<BlockModel>({ required: true })

const props = withDefaults(defineProps<{
  index: number,
  parent?: BlockModel,
  tag: string
}>(), { tag: 'ul' })

const emits = defineEmits<{
  added: [{ block: BlockModel, index: number, parent?: BlockModel }],
  updated: [{ oldBlock: BlockModel, block: BlockModel, index: number, parent?: BlockModel }],
  removed: [{ block: BlockModel, index: number, parent?: BlockModel }],
  change: [BlockModel],
  'update:modelValue': [BlockModel]
}>()

const { el, setBlockRef, addBlock, updateBlock, removeBlock, save } = useBlockOperate(block, emits)

if (!block.value.children?.length) {
  addBlock({
    type: 'text',
    id: Math.random().toString(16).substring(2)
  }, block.value, 0)
}

defineExpose({
  blockSaveType: () => BlockSaveType.Raw,
  save
})
</script>

<style lang="less" scoped>
.list-block-item:has([data-block-node="no-leaf"]) {
  list-style: none
}
</style>