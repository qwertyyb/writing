<template>
  <main class="home-view">
    <div class="tree-view">
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
    </div>
    <div class="spliter"></div>
    <div class="doc-editor">
      <div class="doc-editor-header" v-if="documentStore.editing">
        <el-icon :size="20" class="setting-icon" @click="settingDialogVisible = true"><Setting /></el-icon>
      </div>
      <el-dialog
        title="设置"
        v-model="settingDialogVisible">
        <document-attribute
          v-if="documentStore.editing"
          :doc-id="documentStore.editing?.id"
          :attributes="documentStore.editing?.attributes"
          @change="documentStore.updateAttributes"></document-attribute>
      </el-dialog>
      <div class="doc-editor-wrapper">
        <document-editor
          v-if="documentStore.editing"
          :model-value="documentStore.editing?.content"
          @change="updateHandler"
        ></document-editor>
      </div>
    </div>
  </main>
</template>

<script setup lang="ts">
import DocumentTree from '@/components/DocumentTree.vue';
import DocumentEditor from '@/components/DocumentEditor.vue';
import DocumentAttribute from '@/components/DocumentAttribute.vue';
import type { TreeNodeModel } from '@/components/tree/types';
import { type BlockModel } from '@/models/block';
import { useDocumentStore } from '@/stores/document';
import { Setting } from '@element-plus/icons-vue';
import { ref } from 'vue';
import { createLogger } from '@/utils/logger';

const logger = createLogger('home-view')

const documentStore = useDocumentStore()

documentStore.getList()

const addHandler = async (parent: TreeNodeModel) => {
  logger.i('add tree node in', parent, parent.path + '/' + parent.id)
  documentStore.addDocument(parent)
}

const selectHandler = async (node: TreeNodeModel) => {
  logger.i('select tree node', node)
  documentStore.activeEditing(node.id)
}

const updateHandler = async (content: BlockModel) => {
  documentStore.updateEditingContent(content)
}

const settingDialogVisible = ref(false)

</script>

<style lang="less" scoped>
.home-view {
  display: flex;
  .tree-view {
    flex: 1;
    min-width: 300px;
  }
  .spliter {
    height: 100vh;
    width: 4px;
    background: rgba(220, 220, 220, .8);
    cursor: ew-resize;
  }
  .doc-editor {
    flex: 4;
    max-height: 100vh;
    height: 100%;
    overflow: auto;
    .doc-editor-header {
      padding: 6px 12px;
      display: flex;
      justify-content: flex-end;
      .setting-icon {
        cursor: pointer;
      }
    }
    .doc-editor-wrapper {
      max-width: 80%;
      margin: 0 auto;
    }
  }
}
</style>
