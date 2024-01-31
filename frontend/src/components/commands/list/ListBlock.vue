<template>
  <ul ref="el" class="list-block" data-block-node="no-leaf">
    <li v-for="(child, index) in block.children"
      :key="child.id"
      class="list-block-item"
      :data-block-id="child.id">
      <block-editor
        :model-value="child"
        :index="index"
        :parent="parent"
        ref="blockRefs"
        @add="addBlock($event, child, index)"
        @update="updateBlock($event, child, index)"
        @remove="removeBlock(child, index)"
      ></block-editor>
    </li>
  </ul>
</template>

<script lang="ts" setup>
import { type BlockModel, BlockSaveType } from '@/models/block';
import useBlockOperate from '@/components/block-operate';
import { computed } from 'vue';
import BlockEditor from '@/components/BlockEditor.vue';

const props = defineProps<{
  block: BlockModel,
  index: number,
  parent?: BlockModel,
}>()

const emits = defineEmits<{
  add: [{ block: BlockModel, index: number, parent?: BlockModel }],
  update: [{ oldBlock: BlockModel, block: BlockModel, index: number, parent?: BlockModel }],
  remove: [{ block: BlockModel, index: number, parent?: BlockModel }],
  change: [BlockModel]
}>()

const block = computed(() => props.block)

const { el, blockRefs, addBlock, updateBlock, removeBlock, save } = useBlockOperate(block, emits)

addBlock({
  type: 'text',
  id: Math.random().toString(16).substring(2)
}, props.block, 0)

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