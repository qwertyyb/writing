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
        @merge="merge(path, $event)"
        @move="move(path, $event)"
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
import { type BlockModel } from '@/models/block';
import { computed, inject, onBeforeUnmount, onMounted, watch } from 'vue';
import BlockRenderer from './blocks/BlockRenderer.vue';
import BlockListEditor from './BlockListEditor.vue';
import useBlockOperate, { useMergeBlock, useMoveBlock } from './block-operate';
import { getBlockConfig } from './blocks';
import { focusBefore, focusAfter } from '@/hooks/focus';
import { createLogger } from '@/utils/logger';

const logger = createLogger('BlockEditor')

const block = defineModel<BlockModel>({ required: true })

watch(block, () => {
  logger.i('block changed', JSON.parse(JSON.stringify(block.value)))
}, { deep: true })

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
  change: [BlockModel],
  'update:modelValue': [BlockModel]
  add: [options: Partial<BlockModel>],
  remove: [],
}>()

const needRenderChildren = computed(() => {
  return block.value.children && !getBlockConfig(block.value)?.renderChildren
})

const {
  el,
  addBlock,
  updateBlock,
  removeBlock,
} = useBlockOperate(block, props.path, emits)

onMounted(() => {
  inject<Map<string, Omit<ReturnType<typeof useBlockOperate>, 'el'>>>('blockInstances')?.set(block.value.id, { addBlock, updateBlock, removeBlock })
})

onBeforeUnmount(() => {
  inject<Map<string, Omit<ReturnType<typeof useBlockOperate>, 'el'>>>('blockInstances')?.delete(block.value.id)
})

const { move } = useMoveBlock()

const { merge } = useMergeBlock()

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
</style>./blocks