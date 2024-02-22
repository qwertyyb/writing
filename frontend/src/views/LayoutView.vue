<template>
  <section class="layout-view">
    <aside class="layout-aside">
      <document-tree
        v-if="documentStore.tree"
        :tree="documentStore.tree"
        @add="addHandler"
        @select="selectHandler"
        @toggleExpand="documentStore.toggleExpand"
        @remove="documentStore.removeDocument"
        :selectedId="documentStore.editing?.id"
        :expandedIdMap="documentStore.expandedIdMap"
      ></document-tree>
    </aside>
    <div class="layout-spliter"></div>
    <main class="layout-main">
      <slot>
        <router-view></router-view>
      </slot>
    </main>
  </section>
</template>

<script lang="ts" setup>
import { RouterView } from 'vue-router';
import DocumentTree from '@/components/DocumentTree.vue';
import type { TreeNodeModel } from '@/components/tree/types';
import { useDocumentStore } from '@/stores/document';
import { createLogger } from '@/utils/logger';
import router from '@/router';

const logger = createLogger('layout-view')

const documentStore = useDocumentStore()

documentStore.getList()

const addHandler = async (parent: TreeNodeModel) => {
  logger.i('add tree node in', parent, parent.path + '/' + parent.id)
  documentStore.addDocument(parent)
}

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
    width: 300px;
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