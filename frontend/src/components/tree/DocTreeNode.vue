<template>
  <div class="doc-tree-node"
    :data-tree-node-id-path="node.path"
    :data-tree-node-id="node.id"
    :data-tree-index-path="path.join(',')">
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
      <div class="tree-label-wrapper">
        <div class="tree-label">
          <slot name="node">
            {{ node.title }}
          </slot>
        </div>
      </div>
      <div class="tree-action">
        <span class="material-symbols-outlined add-action action-item" title="添加" @click.stop="addChild">add</span>
        <el-dropdown trigger="hover">
          <span class="material-symbols-outlined more-action action-item" title="更多操作" @click.stop>more_vert</span>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item :icon="Plus" @click.stop="addBefore">在上方插入</el-dropdown-item>
              <el-dropdown-item :icon="Plus" @click.stop="addAfter">在下方插入</el-dropdown-item>
              <el-dropdown-item :icon="Delete" @click.stop="remove">删除文档</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </div>
    <transition name="slide-vertical" @enter="onAnimEnter" @before-leave="setHeight">
      <div v-if="expanded" class="tree-node-children">
        <DocTreeNode
          v-for="(element, index) in node.children"
          :key="element.id"
          :data-tree-id="element.id"
          :path="[...path, index]"
          :node="element" :level="(level || 0) + 1"></DocTreeNode>
      </div>
    </transition>
  </div>
</template>

<script lang="ts" setup>
import { computed, inject, type ComputedRef } from 'vue';
import type { TreeNodeModel } from './types';
import { Delete, Plus } from '@element-plus/icons-vue'

const props = withDefaults(defineProps<{
  node: TreeNodeModel,
  path?: number[]
  level?: number,
}>(), {
  path: () => ([])
})

const treeEmits = inject<
((evt: 'add', current: TreeNodeModel, position: 'before' | 'after' | 'inside') => void)
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

const addChild = () => {
  treeEmits?.('add', props.node, 'inside')
}

const addBefore = () => {
  treeEmits?.('add', props.node, 'before')
}

const addAfter = () => {
  treeEmits?.('add', props.node, 'after')
}

const select = () => {
  treeEmits?.('select', props.node)
}

const remove = () => {
  treeEmits?.('remove', props.node)
}

const onAnimEnter = (el: Element) => {
  setHeight(el);
  (el as HTMLElement).style.height = '0'
  setTimeout(() => {
    (el as HTMLElement).style.height = ''
  })
}

const setHeight = (el: Element) => {
  (el as HTMLElement).style.setProperty('--children-height', el.getBoundingClientRect().height + 'px');
}

</script>

<style lang="less" scoped>
.doc-tree-node {
  position: relative;
  transition: opacity .3s;
  display: grid;
  grid-template-rows: auto 1fr;
  &.movable-cloned {
    background: #fff;
    box-shadow: 0px 4px 7px #bbb;
    border-radius: 4px;
    pointer-events: none;
    opacity: .9;
    position: absolute;
    z-index: 100;
  }
  &.movable-source {
    opacity: .4;
  }
  .tree-node-content {
    display: flex;
    align-items: center;
    cursor: pointer;
    padding: 0 4px;
    border-radius: 4px;
    transition: background .2s;
    box-sizing: border-box;
    position: relative;
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
      &.movable-insert-before .tree-label-wrapper::before {
        opacity: 1;
      }
      &.movable-insert-after .tree-label-wrapper::after {
        opacity: 1;
      }
      &.movable-insert-children {
        background: rgb(227, 219, 5);
      }
    }
    .tree-node-offset {
      height: 1px;
    }
    .tree-label-wrapper {
      width: 0;
      position: relative;
      flex: 1;
      &::before, &::after {
        content: " ";
        position: absolute;
        left: 0;
        width: 100%;
        height: 3px;
        background-color: rgb(227, 219, 5);
        opacity: 0;
      }
      &::before {
        top: -1.5px;
      }
      &::after {
        bottom: -1.5px;
      }
    }
    .tree-label {
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      padding: 3px;
    }
    .tree-node-expand-icon-wrapper {
      height: 24px;
      width: 24px;
      transition: background .2s;
      flex-shrink: 0;
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
      .action-item {
        cursor: pointer;
        border-radius: 4px;
        transition: background .2s;
        &:hover {
          background: #bbb;
        }
      }
      .more-action {
        outline: none;
      }
    }
  }
  .tree-node-children {
    transition: height .3s;
  }
  .slide-vertical-enter-active,
  .slide-vertical-leave-active {
    overflow: hidden;
  }
  .slide-vertical-leave-to {
    height: 0;
  }
  .slide-vertical-enter-to,
  .slide-vertical-leave-from {
    height: var(--children-height, auto)
  }
}
</style>