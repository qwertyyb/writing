<template>
  <section class="layout-view">
    <aside class="layout-aside" :style="{ width: runtimeStore.settings.layout.siderWidth + '%' }">
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
    </aside>
    <div class="layout-spliter"
      @pointerdown="pointerdownHandler"
      @pointermove="pointermoveHandler"
      @pointerup="pointerupHandler"></div>
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
import { ref } from 'vue';
import { useRuntime } from '@/stores/runtime';

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

let dragging = false
const pointerdownHandler = (event: PointerEvent) => {
  (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId)
  dragging = true
}

const pointermoveHandler = (event: PointerEvent) => {
  if (!dragging) return;
  const { width } = document.documentElement.getBoundingClientRect()
  runtimeStore.updateSettings('layout', {
    ...runtimeStore.settings.layout,
    siderWidth: event.clientX / width * 100
  })
}

const pointerupHandler = (event: PointerEvent) => {
  dragging = false;
  (event.target as HTMLElement).releasePointerCapture(event.pointerId)
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