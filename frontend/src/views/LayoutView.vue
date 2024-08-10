<template>
  <column-container class="layout-view"
    ref="container"
    :model-value="runtimeStore.settings.layout.siderWidth"
    :side-hidden="runtimeStore.settings.layout.collapsed"
    @openSide="runtimeStore.updateSettings('layout', { ...runtimeStore.settings.layout, collapsed: false })"
    @closeSide="runtimeStore.updateSettings('layout', { ...runtimeStore.settings.layout, collapsed: true })"
    @update:model-value="runtimeStore.updateSettings('layout', { ...runtimeStore.settings.layout, siderWidth: $event })">
    <template v-slot:side>
      <div class="layout-side-wrapper">
        <search-by-title
          :documents="documentStore.documents"
          @search="treeVisible = false"
          @clear="treeVisible = true"
        ></search-by-title>
        <template v-if="documentStore.tree && treeVisible">
          <document-tree
            :tree="documentStore.tree"
            @add="documentStore.add"
            @select="selectHandler"
            @toggleExpand="node => documentStore.toggleExpand(node.id)"
            @remove="documentStore.remove"
            @move="documentStore.move"
            @hoist="documentStore.hoist"
            :hoistId="documentStore.hoistId"
            :selectedId="documentStore.editing?.id"
            :expandedIdMap="documentStore.expandedIdMap"
          ></document-tree>
          <div class="side-actions">
            <span class="material-symbols-outlined action-item"
              title="设置"
              v-if="hasAuth"
              @click="$router.push({ name: 'settings' })">settings</span>
            <span class="material-symbols-outlined action-item" title="折叠" @click="unExpandAll">unfold_less</span>
            <span class="material-symbols-outlined action-item location-opened" title="定位打开的文档" @click="locateEditing">my_location</span>
            <span class="material-symbols-outlined action-item logout-action"
              title="退出登录"
              @click="logout"
              v-if="hasAuth"
            >logout</span>
            <span class="material-symbols-outlined action-item close-action"
              title="关闭侧边栏"
              @click="runtimeStore.updateSettings('layout', { ...runtimeStore.settings.layout, collapsed: true })">start</span>
          </div>
        </template>
      </div>
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
import SearchByTitle from '@/components/SearchByTitle.vue';
import { ref } from 'vue';
import { useRoute } from 'vue-router';
import { ElMessageBox } from 'element-plus';

const logger = createLogger('LayoutView')

const treeVisible = ref(true)
const hasAuth = ref(import.meta.env.MODE !== 'indexeddb')

const runtimeStore = useRuntime()
const documentStore = useDocumentStore()
const route = useRoute()

documentStore.refresh()

runtimeStore.refresh()
  .then(async () => {
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
const logout = async () => {
  await ElMessageBox.confirm('确认退出登录？', {
    type: 'warning',
    cancelButtonText: '取消',
    confirmButtonText: '退出登录'
  })
  const { useAuthStore } = await import('@/stores/auth')
  useAuthStore().logout()
  router.push({ name: 'auth' })
}

</script>

<style lang="less" scoped>
.layout-view {
  width: 100%;
  height: 100%;
  overflow: auto;
  display: flex;
  .layout-side-wrapper {
    height: 100%;
    display: flex;
    flex-direction: column;
  }
  .side-actions {
    margin-top: auto;
    display: flex;
    flex-wrap: wrap;
    // opacity: 0;
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
      &.location-opened {
        margin-right: auto;
      }
      &.close-action {
        transform: rotate(180deg);
      }
    }
  }
}
</style>