<template>
  <div class="doc-tree-node">
    <div class="tree-node-content"
      :style="{paddingLeft: 24 * (level || 0) + 'px'}"
      :class="{ selected }"
      @click="select">
      <div class="tree-node-expand-icon-wrapper">
        <span class="material-symbols-outlined tree-node-expand-icon"
          :class="{ expanded }"
          v-if="node.children?.length"
          @click.stop="toggleExpand">
        chevron_right
        </span>
      </div>
      <div class="tree-label">
        <slot name="node">
          {{ node.title }}
        </slot>
      </div>
      <div class="tree-action">
        <span class="material-symbols-outlined add-action" title="添加" @click.stop="add">add</span>
        <el-dropdown trigger="click">
          <span class="material-symbols-outlined more-acto" title="更多操作">more_vert</span>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item :icon="Delete" @click.stop="remove">删除文档</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </div>
    <div :modelValue="node.children"
      class="tree-node-children"
      :data-tree-parent-path="node.path"
      :data-tree-parent-id="node.id"
      :data-tree-parent-index-path="path.join(',')"
      :options="{sort: false,animation: 200}"
      :move="moveHandler"
      item-key="id"
      group="node"
      @update:modelValue="updateChildren"
      @end="dragEndHandler"
    >
      <DocTreeNode
        @pointerdown="pointerdownHandler"
        @pointermove="pointermoveHandler"
        @pointerup="pointerupHandler"
        v-for="(element, index) in node.children"
        :key="element.id"
        :data-tree-id="element.id"
        :path="[...path, index]"
        :node="element" :level="(level || 0) + 1" @update:node="childUpdateHandler(index, $event)"></DocTreeNode>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, inject, type ComputedRef } from 'vue';
import type { TreeNodeModel } from './types';
import { Delete } from '@element-plus/icons-vue'
import { logger } from '@/utils/logger';

const props = withDefaults(defineProps<{
  node: TreeNodeModel,
  path?: number[]
  level?: number,
}>(), {
  path: () => ([])
})

const emits = defineEmits<{
  'update:node': [TreeNodeModel]
}>()

const treeEmits = inject<
((evt: 'add', parent: TreeNodeModel) => void)
& ((evt: 'select', node: TreeNodeModel) => void)
& ((evt: 'toggleExpand', node: TreeNodeModel) => void)
& ((evt: 'remove', node: TreeNodeModel) => void)
& ((evt: 'move', args: {
    fromId: number, fromIndexPath: number,
    toId: number, toIndexPath: number,
    itemId: number,
    oldIndex: number, newIndex: number
  }) => void)
>('tree')

const treeExpandedState = inject<ComputedRef<Record<string, boolean>>>('treeExpandedIdMap')
const treeSelectedId = inject<ComputedRef<number | string>>('treeSelectedId')

const selected = computed(() => treeSelectedId?.value === props.node.id)
const expanded = computed(() => treeExpandedState?.value[props.node.id])

const toggleExpand = () => {
  treeEmits?.('toggleExpand', props.node)
}

const add = () => {
  treeEmits?.('add', props.node)
}

const select = () => {
  treeEmits?.('select', props.node)
}

const remove = () => {
  treeEmits?.('remove', props.node)
}

const updateChildren = (children: TreeNodeModel[]) => {
  emits('update:node', { ...props.node, children })
}

const childUpdateHandler = (childIndex: number, node: TreeNodeModel) => {
  const children = props.node.children.map((item, index) => {
    if (index === childIndex) return node
    return item
  })
  emits('update:node', { ...props.node, children })
}

const dragEndHandler = (event: any) => {
  logger.i('dragEndHandler', event)
  const { from, to, item, oldIndex, newIndex } = event
  const fromId = Number(from.dataset.treeParentId)
  const toId = Number(to.dataset.treeParentId)
  const itemId = Number(item.dataset.treeId)
  const fromIndexPath = from.dataset.treeParentIndexPath
    .split(',')
    .filter((str: string) => str)
    .map((item: string) => Number(item))
  const toIndexPath = to.dataset.treeParentIndexPath
    .split(',')
    .filter((str: string) => str)
    .map((item: string) => Number(item))
  const options = { fromId, fromIndexPath, toId, toIndexPath, itemId, oldIndex, newIndex }
  treeEmits?.('move', options)
}

const moveHandler = (event: any) => {
}

const pointerdownHandler = (event: PointerEvent) => {
  (event.target as HTMLElement).setPointerCapture(event.pointerId)
}

const pointermoveHandler = (event: PointerEvent) => {
  if (event.buttons !== 1) return
  event.preventDefault()
  let element = document.elementFromPoint(event.clientX, event.clientY)
  if (!element?.classList.contains('doc-tree-node')) {
    element = element!.closest('.doc-tree-node')
  }
  element = element?.querySelector('.tree-node-content') ?? null
  if (!element) return
  const { height, top } = element.getBoundingClientRect()
  const areaTop = top + height / 4
  const areaBottom = top + height / 4 * 3

  document.querySelectorAll('.movable-selected').forEach(d => d.classList.remove('movable-selected', 'movable-insert-children', 'movable-insert-before', 'movable-insert-after'))
  logger.i('area', event.clientY, areaTop, areaBottom)
  if (event.clientY < areaTop) {
    element.classList.add('movable-selected', 'movable-insert-before')
  } else if (event.clientY > areaBottom) {
    element.classList.add('movable-selected', 'movable-insert-after')
  } else {
    element.classList.add('movable-selected', 'movable-insert-children')
  }
  logger.i('moveHandler', element, element?.textContent)
}

const pointerupHandler = (event: PointerEvent) => {
  document.querySelectorAll('.movable-selected')
  .forEach(d => d.classList.remove('movable-selected', 'movable-insert-children', 'movable-insert-before', 'movable-insert-after'));
  (event.target as HTMLElement).releasePointerCapture(event.pointerId)
}

</script>

<style lang="less" scoped>
.doc-tree-node {
  .tree-node-content {
    display: flex;
    align-items: center;
    cursor: pointer;
    padding: 0 4px;
    border-radius: 4px;
    transition: background .2s;
    box-sizing: border-box;
    border-top: 3px solid transparent;
    border-bottom: 3px solid transparent;
    &:hover {
      background: rgba(220, 220, 220, .5);
      .tree-action {
        opacity: 1;
      }
    }
    &.selected {
      background: rgba(220, 220, 220, .8);
      .tree-action {
        opacity: 1;
      }
    }
    &.movable-selected {
      &.movable-insert-before {
        border-top: 3px solid rgb(227, 219, 5);
      }
      &.movable-insert-after {
        border-bottom: 3px solid rgb(227, 219, 5);
      }
      &.movable-insert-children {
        background: rgb(227, 219, 5);
      }
    }
    .tree-node-offset {
      height: 1px;
    }
    .tree-label {
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .tree-node-expand-icon-wrapper {
      height: 24px;
      width: 24px;
      transition: background .2s;
      &:not(:empty):hover {
        background: rgba(200, 200, 200, .8);
      }
    }
    .tree-node-expand-icon {
      transition: transform .2s;
      border-radius: 6px;
      &.expanded {
        transform: rotateZ(90deg);
      }
    }
    .tree-action {
      margin-left: auto;
      height: 24px;
      color: #333;
      opacity: 0;
      transition: opacity .2s;
      .add-action {
        cursor: pointer;
        border-radius: 4px;
        transition: background .2s;
        &:hover {
          background: #bbb;
        }
      }
    }
  }
  // .tree-node-children:empty {
  //   padding: 10px 0;
  // }
}
</style>