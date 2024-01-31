<template>
  <div class="doc-tree">
    <DocTreeNode v-for="child in tree"
      :key="child.id"
      :node="child"></DocTreeNode>
  </div>
</template>

<script lang="ts" setup>
import { provide, ref } from 'vue';
import DocTreeNode from './DocTreeNode.vue';

const props = defineProps({
  tree: {
    default: [
      { id: '1', label: 'tree1', children: [
        { id: '11', label: 'tree11', children: [
          { id: '111', label: 'tree111' }
        ]}
      ]}
    ]
  }
})

const treeExpandedState = ref<Record<string, boolean>>({})
const treeSelectedState = ref<Record<string, boolean>>({})

provide('treeExpandedState', treeExpandedState)
provide('treeSelectedState', treeSelectedState)

</script>