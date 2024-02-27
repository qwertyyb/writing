<template>
  <doc-tree :tree="tree" :selectedIdList="selectedIdList" :expandedIdMap="expandedIdMap"></doc-tree>
</template>
<script lang="ts" setup>
import DocTree from './tree/DocTree.vue';
import type { DocumentItem } from '@/stores/document';

defineProps<{
  tree: DocumentItem,
  expandedIdMap: Record<number | string, boolean>,
  selectedIdList?: Record<number | string, boolean>
}>()

</script>