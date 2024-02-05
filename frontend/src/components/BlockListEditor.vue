<template>
  <div class="block-list-editor" ref="el">
    <div class="block-list">
      <block-editor v-for="(child, index) in model.children"
        :key="child.id + child.type"
        :model-value="child"
        :index="index"
        :path="[...path, index]"
        :parent="model"
        @update:modelValue="updateBlock($event, child, index)"
        @add="addBlock($event, child, index)"
        @addAfter="addBlock($event, child, index)"
        @remove="removeBlock(child, index)"
        @increaseLevel="increaseLevelBlock(child, index)"
        @decreaseLevel="decreaseLevelBlock(child, index)"
        :ref="el => setBlockRef(child.id, el as any)"
      ></block-editor>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { createBlock, type BlockModel } from '@/models/block';
import BlockEditor from './BlockEditor.vue';
import useBlockOperate from './block-operate';
import type { PropType } from 'vue';

const model = defineModel<ReturnType<typeof createBlock>>({
  required: true
})

const props = defineProps({
  index: {
    type: Number,
    default: 0
  },
  path: {
    type: Array as PropType<number[]>,
    default: () => [0]
  }
})

const emits = defineEmits<{
  addAfter: [BlockModel],
  added: [{ block: BlockModel, index: number, parent?: BlockModel }],
  updated: [{ oldBlock: BlockModel, block: BlockModel, index: number, parent?: BlockModel }],
  removed: [{ block: BlockModel, index: number, parent?: BlockModel }],
  change: [BlockModel],
  'update:modelValue': [BlockModel]
}>()

const decreaseLevelBlock = (child: BlockModel, childIndex: number) => {
  // 判断层级，只要层级不是最高层或第二次就可以向外移动
  if (props.path.length <= 1) return;
  const removed = removeBlock(child, childIndex)
  emits('addAfter', removed)
}

const {
  el,
  setBlockRef,
  addBlock,
  updateBlock,
  removeBlock,
  increaseLevelBlock,
  // decreaseLevelBlock,
  save
} = useBlockOperate(model, emits)

defineExpose({
  save
})
</script>

<style scoped>
.rich-text-editor {
  min-width: 50vw;
  min-height: 50vh;
  position: relative;
}
</style>