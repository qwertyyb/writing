<template>
  <div class="block-editor" :class="'block-type-' + block.type" :data-block-id="block.id" ref="el">
    <!-- <div class="block-tool">
      <span class="material-symbols-outlined block-tool-icon"> drag_indicator </span>
    </div> -->
    <div class="block-content">
      <block-renderer
        :model-value="block"
        :index="index"
        :parent="parent"
        :path="path"
        @update:modelValue="$emit('update:modelValue', $event)"
        @add="$emit('add', $event)"
        @remove="$emit('remove')"
        @move="move(path, $event)"
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
import { computed, inject, onBeforeUnmount, onMounted } from 'vue';
import BlockRenderer from './commands/BlockRenderer.vue';
import BlockListEditor from './BlockListEditor.vue';
import useBlockOperate, { useMoveBlock } from './block-operate';
import { getBlockConfig } from './commands';

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
} = useBlockOperate(block, emits)

onMounted(() => {
  inject<Map<string, Omit<ReturnType<typeof useBlockOperate>, 'el'>>>('blockInstances')?.set(block.value.id, { addBlock, updateBlock, removeBlock })
})

onBeforeUnmount(() => {
  inject<Map<string, Omit<ReturnType<typeof useBlockOperate>, 'el'>>>('blockInstances')?.delete(block.value.id)
})

const { move } = useMoveBlock()

</script>

<style lang="less" scoped>
.block-editor {
  display: flex;
  align-items: flex-start;
  justify-content: flex-start;
  flex-direction: column;
  padding: 6px 0;
  & > * {
    width: 100%;
  }
  & > .block-children {
    margin-left: 28px;
  }
  &:hover, &focus-within {
    .block-tool {
      opacity: 1;
    }
  }
  .block-tool {
    width: 24px;
    height: 24px;
    cursor: pointer;
    opacity: 0;
  }
  .block-tool-icon {
    font-size: 24px;
    user-select: none;
    color: rgb(190, 190, 190);
    font-weight: 300;
    border-radius: 4px;
    transition: background .2s;
    &:hover {
      background: rgba(230, 230, 230);
    }
  }
  .block-content {
    flex: 1;
  }
}
</style>