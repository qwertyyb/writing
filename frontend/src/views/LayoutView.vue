<template>
  <column-container class="layout-view"
    v-model="runtimeStore.settings.layout.siderWidth"
    :side-hidden="sideHidden"
    @openSide="sideHidden = false"
    @change="runtimeStore.updateSettings('layout', { ...runtimeStore.settings.layout, siderWidth: $event })">
    <template v-slot:side>
      <div class="side-actions">
        <span class="material-symbols-outlined action-item" title="折叠" @click="unExpandAll">unfold_less</span>
        <span class="material-symbols-outlined action-item" title="定位打开的文档" @click="locateEditing">my_location</span>
        <span class="material-symbols-outlined action-item close-action" title="关闭侧边栏" @click="closeSide">start</span>
      </div>
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
        @toggleExpand="node => documentStore.toggleExpand(node.id)"
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
import { useRoute } from 'vue-router';

const logger = createLogger('LayoutView')

const treeVisible = ref(true)
const sideHidden = ref(false)

const runtimeStore = useRuntime()
const documentStore = useDocumentStore()
const route = useRoute()

documentStore.getList()

runtimeStore.refresh()
  .then(() => {
    if (router.currentRoute.value.name !== 'admin') return;
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

const unExpandAll = () => {
  documentStore.expandAll(false)
}
const locateEditing = () => {
  if (route.name !== 'document' || !route.params.id) return
  
  const document = documentStore.documents.find(item => item.id === Number(route.params.id))
  if (!document) return
  const ids = document?.path.split('/').map(item => Number(item))
  ids.forEach(id => {
    documentStore.toggleExpand(id, true)
  })
}
const closeSide = () => {
  sideHidden.value = true
}

</script>

<style lang="less" scoped>
.layout-view {
  width: 100%;
  height: 100%;
  overflow: auto;
  display: flex;
  .side-actions {
    display: flex;
    justify-content: flex-end;
    opacity: 0;
    transition: opacity .2s;
    &:hover {
      opacity: 1;
    }
    .action-item {
      cursor: pointer;
      font-size: 20px;
      color: #444;
      transition: background .2s;
      padding: 4px;
      &:hover {
        background: #eee;
        border-radius: 4px;
      }
      &.close-action {
        transform: rotate(180deg);
      }
    }
  }
}
</style>