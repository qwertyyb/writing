<template>
  <div class="doc-tree">
    <DocTreeNode
      :node="tree"
      @update:node="nodeUpdateHandler"></DocTreeNode>
  </div>
</template>

<script lang="ts" setup>
import { computed, provide } from 'vue';
import DocTreeNode from './DocTreeNode.vue';
import type { TreeNodeModel } from './types';

const props = defineProps<{
  tree: TreeNodeModel,
  expandedIdMap?: Record<number | string, boolean>,
  selectedId?: number | string
}>()

const emits = defineEmits<{
  add: [parent: TreeNodeModel],
  select: [node: TreeNodeModel],
  toggleExpand: [node: TreeNodeModel],
  remove: [node: TreeNodeModel],
  move: [{ fromId: number, fromIndexPath: number[], toId: number, toIndexPath: number[], itemId: number, oldIndex: number, newIndex: number }],
  'update:tree': [TreeNodeModel],
}>()

const nodeUpdateHandler = (node: TreeNodeModel) => {
  emits('update:tree', node)
}

provide('treeSelectedId', computed(() => props.selectedId))
provide('treeExpandedIdMap', computed(() => props.expandedIdMap))
provide('tree', emits)

</script>