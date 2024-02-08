<template>
  <div class="doc-tree">
    <DocTreeNode
      :node="tree"></DocTreeNode>
  </div>
</template>

<script lang="ts" setup>
import { computed, provide, ref } from 'vue';
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
  remove: [node: TreeNodeModel]
}>()


provide('treeSelectedId', computed(() => props.selectedId))
provide('treeExpandedIdMap', computed(() => props.expandedIdMap))
provide('tree', emits)

</script>