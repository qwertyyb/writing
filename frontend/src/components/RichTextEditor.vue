<template>
  <div class="rich-text-editor" ref="el">
    <div class="block-list">
      <block-editor v-for="(block, index) in model.children"
        :key="block.id"
        :model-value="block"
        :index="index"
        :parent="model"
        @add="addBlock($event, block, index)"
        @update="updateBlock($event, block, index)"
        @remove="removeBlock(block, index)"
        ref="blockRefs"
      ></block-editor>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { createBlock, type BlockModel } from '@/models/block';
import BlockEditor from './BlockEditor.vue';
import useBlockOperate from './block-operate';

const model = defineModel<ReturnType<typeof createBlock>>({
  required: true
})

const emits = defineEmits<{
  add: [{ block: BlockModel, index: number, parent?: BlockModel }],
  update: [{ oldBlock: BlockModel, block: BlockModel, index: number, parent?: BlockModel }],
  remove: [{ block: BlockModel, index: number, parent?: BlockModel }],
  change: [BlockModel]
}>()

const { el, blockRefs, addBlock, updateBlock, removeBlock, save } = useBlockOperate(model, emits)

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