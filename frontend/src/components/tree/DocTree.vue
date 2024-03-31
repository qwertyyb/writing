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
import { useMovable } from '@writing/utils/movable';
import { createLogger } from '@writing/utils/logger';

const logger = createLogger('DocTree')

const props = defineProps<{
  tree: TreeNodeModel,
  expandedIdMap?: Record<number | string, boolean>,
  selectedId?: number | string,
  hoistId?: number
}>()

const emits = defineEmits<{
  add: [current: TreeNodeModel, position: 'before' | 'after' | 'inside'],
  select: [node: TreeNodeModel],
  toggleExpand: [node: TreeNodeModel],
  remove: [node: TreeNodeModel],
  move: [params: { sourceId: number, sourceIndexPath: number[], toId: number, toIndexPath: number[],
    position: 'before' | 'after' | 'inside' }],
  hoist: [node: TreeNodeModel],
  'update:tree': [TreeNodeModel],
}>()

const nodeUpdateHandler = (node: TreeNodeModel) => {
  emits('update:tree', node)
}

provide('treeSelectedId', computed(() => props.selectedId))
provide('treeExpandedIdMap', computed(() => props.expandedIdMap))
provide('treeHoistId', computed(() => props.hoistId))
provide('tree', emits)

const { pointerdownHandler, pointermoveHandler, pointerupHandler } = useMovable(({ source, target, position }) => {
  const toIndexPath = target.dataset.treeIndexPath?.split(',').filter(i => i).map(i => Number(i)) ?? []

  const sourceIndexPath = source.dataset.treeIndexPath?.split(',').filter(i => i).map(i => Number(i)) ?? []
  const sourceId = Number(source.dataset.treeNodeId)
  const toId = Number(target.dataset.treeNodeId)

  logger.i('move', { sourceId, sourceIndexPath, toIndexPath, toId, position }, toIndexPath.join(','), sourceIndexPath.join(','))
  // 不能把自己移动到子节点内
  if (toIndexPath.join(',').startsWith(sourceIndexPath.join(','))) return;
  emits('move', { sourceId, sourceIndexPath, toIndexPath, toId, position })
})

</script>