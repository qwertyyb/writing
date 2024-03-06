<template>
  <div class="block-editor" :class="'block-type-' + block.type" ref="el" contenteditable="false">
    <div class="block-content">
      <block-renderer
        :model-value="block"
        :index="index"
        :parent="parent"
        :path="path"
        @update:modelValue="$emit('update:modelValue', $event)"
        @add="$emit('add', $event)"
        @remove="$emit('remove')"
        @merge="merge(path)"
        @move="move(path, $event)"
        @moveUpper="moveUpper(path)"
        @moveLower="moveLower(path)"
        @focusBefore="focusBefore"
        @focusAfter="focusAfter"
      ></block-renderer>
    </div>
    <div class="block-children" v-if="needRenderChildren && block.children">
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
import { type BlockModel } from '../models/block';
import { computed } from 'vue';
import BlockRenderer from './blocks/BlockRenderer.vue';
import BlockListEditor from './BlockListEditor.vue';
import { getBlockConfig } from './blocks';
import { focusBefore, focusAfter } from '../hooks/focus';
import { useMerge, useMove, useOperator } from '../hooks/operator';

const block = defineModel<BlockModel>({ required: true })

const props = defineProps<{
  index: number,
  path: number[],
  parent?: BlockModel
}>()

const emits = defineEmits<{
  added: [{ block: BlockModel, index: number, parent?: BlockModel }],
  updated: [{ oldBlock: BlockModel, block: BlockModel, index: number, parent?: BlockModel }],
  removed: [{ removed: BlockModel, index: number, parent?: BlockModel }],
  merge: [mergePath: number[]],
  change: [BlockModel, any[]],
  'update:modelValue': [BlockModel]
  add: [options: Partial<BlockModel>],
  remove: [],
}>()

const needRenderChildren = computed(() => {
  return block.value.children && !getBlockConfig(block.value)?.renderChildren
})

const {
  addBlock,
  updateBlock,
  removeBlock,
} = useOperator(props)

const { move, moveUpper, moveLower } = useMove()

const { merge } = useMerge()

</script>

<style lang="less" scoped>
.block-editor {
  display: flex;
  align-items: flex-start;
  justify-content: flex-start;
  flex-direction: column;
  padding: 6px 0;
  box-sizing: border-box;
  & > * {
    width: 100%;
  }
  & > .block-children {
    padding-left: 28px;
    box-sizing: border-box;
  }
  .block-content {
    flex: 1;
  }
}
</style>./blocks../models/block-operate