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
    <div class="tree-node-children" v-if="expanded && node.children?.length">
      <DocTreeNode v-for="child in node.children" :key="child.id" :node="child" :level="(level || 0) + 1"></DocTreeNode>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, inject, type ComputedRef } from 'vue';
import type { TreeNodeModel } from './types';
import { Delete } from '@element-plus/icons-vue'

const props = defineProps<{
  node: TreeNodeModel,
  level?: number,
}>()

defineEmits<{
  toggleExpand: []
}>()

const treeEmits = inject<
((evt: 'add', parent: TreeNodeModel) => void)
& ((evt: 'select', node: TreeNodeModel) => void)
& ((evt: 'toggleExpand', node: TreeNodeModel) => void)
& ((evt: 'remove', node: TreeNodeModel) => void)
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

</script>

<style lang="less" scoped>
.doc-tree-node {
  .tree-node-content {
    display: flex;
    align-items: center;
    cursor: pointer;
    padding: 2px 4px;
    border-radius: 4px;
    transition: background .2s;
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
}
</style>