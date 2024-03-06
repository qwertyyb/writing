<template>
  <div class="document-view" :key="id">
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
        @change="documentStore.updateAttributes(documentStore.editing!.id, $event)"></document-attribute>
    </el-dialog>
    <div class="document-editor-wrapper">
      <document-editor
        v-if="documentStore.editing"
        v-model="documentStore.editing.content"
        @update:model-value="updateHandler"
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
import DocumentEditor from '@writing/editor';
import { debounce } from '@/utils/utils';

const props = defineProps<{
  id: number | string
}>()

const documentStore = useDocumentStore()

const updateHandler = debounce(async (content: BlockModel) => {
  documentStore.updateEditingContent(content)
})

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