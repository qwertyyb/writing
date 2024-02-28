<template>
  <div class="doc-tree"
    @pointerdown="pointerdownHandler"
    @pointermove="pointermoveHandler"
    @pointerup="pointerupHandler">
    <DocTreeNode
      :node="tree"
      @update:node="nodeUpdateHandler"></DocTreeNode>
  </div>
</template>

<script lang="ts" setup>
import { computed, provide } from 'vue';
import DocTreeNode from './DocTreeNode.vue';
import type { TreeNodeModel } from './types';
import { useMove } from './useMove';

const props = defineProps<{
  tree: TreeNodeModel,
  expandedIdMap?: Record<number | string, boolean>,
  selectedId?: number | string
}>()

const emits = defineEmits<{
  add: [current: TreeNodeModel, position: 'before' | 'after' | 'inside'],
  select: [node: TreeNodeModel],
  toggleExpand: [node: TreeNodeModel],
  remove: [node: TreeNodeModel],
  'update:tree': [TreeNodeModel],
}>()

const nodeUpdateHandler = (node: TreeNodeModel) => {
  emits('update:tree', node)
}

provide('treeSelectedId', computed(() => props.selectedId))
provide('treeExpandedIdMap', computed(() => props.expandedIdMap))
provide('tree', emits)

const { pointerdownHandler, pointermoveHandler, pointerupHandler } = useMove()

</script>