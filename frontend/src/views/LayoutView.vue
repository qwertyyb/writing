<template>
  <column-container class="layout-view" v-model="runtimeStore.settings.layout.siderWidth"
    @change="runtimeStore.updateSettings('layout', { ...runtimeStore.settings.layout, siderWidth: $event })">
    <template v-slot:side>
      <search-by-title
        :documents="documentStore.documents"
        @search="treeVisible = false"
        @clear="treeVisible = true"
      ></search-by-title>
      <document-tree
        v-if="documentStore.tree && treeVisible"
        :tree="documentStore.tree"
        @add="documentStore.add"
        @select="selectHandler"
        @toggleExpand="documentStore.toggleExpand"
        @remove="documentStore.remove"
        @move="documentStore.move"
        :selectedId="documentStore.editing?.id"
        :expandedIdMap="documentStore.expandedIdMap"
      ></document-tree>
    </template>
    <router-view></router-view>
  </column-container>
</template>

<script lang="ts" setup>
import { RouterView } from 'vue-router';
import DocumentTree from '@/components/DocumentTree.vue';
import type { TreeNodeModel } from '@/components/tree/types';
import { useDocumentStore } from '@/stores/document';
import { createLogger } from '@/utils/logger';
import router from '@/router';
import { useRuntime } from '@/stores/runtime';
import ColumnContainer from '@/components/ColumnContainer.vue';
import SearchByTitle from '../components/SearchByTitle.vue';
import { ref } from 'vue';

const logger = createLogger('LayoutView')

const treeVisible = ref(true)

const runtimeStore = useRuntime()
const documentStore = useDocumentStore()

documentStore.getList()

runtimeStore.refresh()
  .then(() => {
    router.push({
      name: 'document',
      params: { id: runtimeStore.settings.recentDocumentId }
    })
  })

const selectHandler = async (node: TreeNodeModel) => {
  logger.i('select tree node', node)
  router.push({
    name: 'document',
    params: { id: node.id }
  })
  runtimeStore.updateSettings('recentDocumentId', node.id)
}

const moveHandler = () => {
  logger.i('moveHandler')
}

</script>

<style lang="less" scoped>
.layout-view {
  width: 100%;
  height: 100%;
  overflow: auto;
  display: flex;
}
</style>