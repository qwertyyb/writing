<template>
  <component ref="el" class="list-block" data-block-node="no-leaf" :is="tag">
    <li v-for="(child, index) in block.children"
      :key="child.id + child.type"
      class="list-block-item">
      <block-editor
        :model-value="child"
        :index="index"
        :parent="parent"
        :path="[...path, index]"
        @update:modelValue="updateBlock(index, $event, child)"
        @add="addBlock($event, index)"
        @remove="removeBlock(index)"
      ></block-editor>
    </li>
  </component>
</template>

<script lang="ts" setup>
import { type BlockModel } from '@/models/block';
import useBlockOperate from '@/components/block-operate';
import BlockEditor from '@/components/BlockEditor.vue';
import { watch } from 'vue';

const block = defineModel<BlockModel>({ required: true })

const props = withDefaults(defineProps<{
  index: number,
  parent?: BlockModel,
  path: number[],
  tag: string
}>(), { tag: 'ul' })

const emits = defineEmits<{
  added: [{ block: BlockModel, index: number, parent?: BlockModel }],
  updated: [{ oldBlock: BlockModel, block: BlockModel, index: number, parent?: BlockModel }],
  removed: [{ removed: BlockModel, index: number, parent?: BlockModel }],
  change: [BlockModel],
  'update:modelValue': [BlockModel],
  remove: [],
}>()

const { el, addBlock, updateBlock, removeBlock } = useBlockOperate(block, emits)

if (!block.value.children?.length) {
  addBlock({
    type: 'text',
    id: Math.random().toString(16).substring(2)
  }, 0)
}

watch(() => block.value.children?.length ?? 0, (newVal, oldVal) => {
  if (oldVal && !newVal) {
    // 所有的子节点已删除，把当前节点也删除
    emits('remove')
  }
})

</script>

<style lang="less" scoped>
</style>