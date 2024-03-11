<template>
  <div class="document-view" :key="id">
    <div class="document-view-header" v-if="documentStore.editing">
      <el-dropdown @command="commandHandler">
        <el-icon :size="20" class="setting-icon"><MoreFilled /></el-icon>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="export.markdown">导出为 Markdown</el-dropdown-item>
            <el-dropdown-item divided command="settings">设置</el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
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
        :upload="uploadHandler"
      ></document-editor>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { saveAs } from 'file-saver';
import type { BlockModel } from '@/models/block';
import { useDocumentStore } from '@/stores/document';
import { MoreFilled } from '@element-plus/icons-vue';
import { ref, watchEffect } from 'vue';
import DocumentAttribute from '@/components/DocumentAttribute.vue';
import DocumentEditor from '@writing/editor';
import { debounce } from '@/utils/utils';
import { upload } from '@/services/upload';
import { toMarkdown } from '@writing/editor/markdown';

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

const uploadHandler = async (file: Blob | File) => {
  const { data } = await upload(file)
  if (data.url) return data.url
  throw new Error('上传失败')
}

const commandHandler = (command: string) => {
  if (command === 'settings') {
    settingDialogVisible.value = true
    return
  } else if (command === 'export.markdown') {
    const markdown = toMarkdown(documentStore.editing.content)
    const blob = new Blob([markdown], { type: 'text/plain;charset=utf-8' })
    saveAs(blob, documentStore.editing.title + '.md')
    console.log('markdown', markdown)
  }
}

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
  .setting-icon {
    cursor: pointer;
  }
}
.document-editor-wrapper {
  box-sizing: border-box;
  padding: 0 36px;
}
</style>