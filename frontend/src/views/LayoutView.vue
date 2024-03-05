<template>
  <column-container class="layout-view" v-model="runtimeStore.settings.layout.siderWidth"
    @change="runtimeStore.updateSettings('layout', { ...runtimeStore.settings.layout, siderWidth: $event })">
    <template v-slot:side>
      <document-tree
        v-if="documentStore.tree"
        :tree="documentStore.tree"
        @move="documentStore.move"
        @add="documentStore.add"
        @select="selectHandler"
        @toggleExpand="documentStore.toggleExpand"
        @remove="documentStore.remove"
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

const logger = createLogger('layout-view')

const runtimeStore = useRuntime()
const documentStore = useDocumentStore()

runtimeStore.refresh()
documentStore.getList()

const selectHandler = async (node: TreeNodeModel) => {
  logger.i('select tree node', node)
  router.push({
    name: 'document',
    params: { id: node.id }
  })
}

</script>

<style lang="less" scoped>
.layout-view {
  width: 100%;
  height: 100%;
  overflow: auto;
  display: flex;
  .layout-aside {
    height: 100%;
  }
  .layout-spliter {
    height: 100%;
    width: 4px;
    background: rgba(220, 220, 220, .8);
    cursor: ew-resize;
  }
  .layout-main {
    flex: 1;
    height: 100%;
    overflow: auto;
  }
}
</style>