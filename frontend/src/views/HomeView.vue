<template>
  <main class="home-view">
    <div class="tree-view">
      <doc-tree></doc-tree>
    </div>
    <div class="spliter"></div>
    <div class="doc-editor">
      <div class="doc-editor-wrapper">
        <doc-editor></doc-editor>
      </div>
    </div>
  </main>
</template>

<script setup lang="ts">
import DocTree from '@/components/tree/DocTree.vue';
import DocEditor from '@/components/DocEditor.vue';
</script>

<style lang="less" scoped>
.home-view {
  display: flex;
  .tree-view {
    flex: 1;
  }
  .spliter {
    height: 100vh;
    width: 4px;
    background: rgba(220, 220, 220, .8);
    cursor: ew-resize;
  }
  .doc-editor {
    flex: 4;
    .doc-editor-wrapper {
      max-width: 80%;
      margin: 0 auto;
    }
  }
}
</style>
