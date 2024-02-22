<template>
  <div class="document-view">
    <div class="document-view-header" v-if="documentStore.editing">
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
    <div class="document-editor-wrapper">
      <document-editor
        v-if="documentStore.editing"
        :model-value="documentStore.editing?.content"
        @change="updateHandler"
      ></document-editor>
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { BlockModel } from '@/models/block';
import { useDocumentStore } from '@/stores/document';
import { Setting } from '@element-plus/icons-vue';
import { ref, watchEffect } from 'vue';
import DocumentAttribute from '@/components/DocumentAttribute.vue';
import DocumentEditor from '@/components/DocumentEditor.vue';

const props = defineProps<{
  id: number | string
}>()

const documentStore = useDocumentStore()

const updateHandler = async (content: BlockModel) => {
  documentStore.updateEditingContent(content)
}

const settingDialogVisible = ref(false)

watchEffect(() => {
  return documentStore.activeEditing(Number(props.id))
})
</script>

<style lang="less" scoped>
.document-view {
  box-sizing: border-box;
  padding: 16px;
}
.document-view-header {
  display: flex;
  justify-content: flex-end;
  padding: 0 16px 8px 16px;
}
.document-editor-wrapper {
  box-sizing: border-box;
  padding: 0 36px;
}
</style>