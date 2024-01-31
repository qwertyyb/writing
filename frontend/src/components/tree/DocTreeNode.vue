<template>
  <div class="doc-tree-node">
    <div class="tree-node-content"
      :style="{paddingLeft: 24 * (level || 0) + 'px'}"
      :class="{ selected }"
      @click="toggleSelected">
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
          {{ node.label }}
        </slot>
      </div>
    </div>
    <div class="tree-node-children" v-if="expanded && node.children?.length">
      <DocTreeNode v-for="child in node.children" :key="child.id" :node="child" :level="(level || 0) + 1"></DocTreeNode>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, inject, type Ref } from 'vue';

interface DocTreeNode {
  id: string,
  label?: string,
  children?: DocTreeNode[]
  [x: string]: any
}

const props = defineProps<{
  node: DocTreeNode,
  level?: number,
}>()

defineEmits<{
  toggleExpand: []
}>()

const treeExpandedState = inject<Ref<Record<string, boolean>>>('treeExpandedState')
const treeSelectedState = inject<Ref<Record<string, boolean>>>('treeSelectedState')

const expanded = computed(() => treeExpandedState?.value[props.node.id])
const selected = computed(() => treeSelectedState?.value[props.node.id])

const toggleExpand = () => {
  if (!treeExpandedState?.value) return
  treeExpandedState.value[props.node.id] = !treeExpandedState.value[props.node.id];
}

const toggleSelected = () => {
  if (!treeSelectedState?.value) return
  treeSelectedState.value[props.node.id] = !treeSelectedState.value[props.node.id];
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
    }
    .tree-node-offset {
      height: 1px;
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
  }
}
</style>