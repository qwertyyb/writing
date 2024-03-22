<template>
  <div class="document-view">
    <div class="document-view-header" v-if="documentStore.editing">
      <el-dropdown @command="commandHandler">
        <el-icon :size="20" class="setting-icon action-icon"><MoreFilled /></el-icon>
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
        :key="documentStore.editing.id"
        v-model="documentStore.editing.content"
        @update:model-value="updateHandler"
        :upload="uploadHandler"
      ></document-editor>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { saveAs } from 'file-saver';
import { useDocumentStore } from '@/stores/document';
import { MoreFilled } from '@element-plus/icons-vue';
import { ref, watch } from 'vue';
import DocumentAttribute from '@/components/DocumentAttribute.vue';
import DocumentEditor from '@writing/editor';
import { debounce } from '@/utils/utils';
import { toMarkdown } from '@writing/editor/markdown';
import type { BlockModel } from '@writing/editor/block';
import { createLogger } from '@writing/utils/logger';
import { fileService } from '@/services';

const logger = createLogger('DocumentView')

const props = defineProps<{
  id: number | string
}>()

const documentStore = useDocumentStore()

const updateHandler = debounce(async (content: BlockModel) => {
  documentStore.updateEditingContent(content)
})

const settingDialogVisible = ref(false)

watch(
  () => props.id,
  () => {
    return documentStore.activeEditing(Number(props.id))
  },
  { immediate: true }
)

const uploadHandler = async (file: Blob | File) => {
  const { data } = await fileService.upload(file)
  if (data.url) return data.url
  throw new Error('上传失败')
}

const commandHandler = (command: string) => {
  if (command === 'settings') {
    settingDialogVisible.value = true
    return
  } else if (command === 'export.markdown') {
    const markdown = toMarkdown(documentStore.editing!.content)
    logger.i('commandHandler', command, markdown)
    const blob = new Blob([markdown], { type: 'text/plain;charset=utf-8' })
    saveAs(blob, documentStore.editing!.title + '.md')
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
  padding: 0 0 8px 0;
  .action-icon {
    transition: background .3s;
    cursor: pointer;
    padding: 4px;
    &:hover {
      background: #eee;
      border-radius: 4px;
    }
  }
  .setting-icon {
    cursor: pointer;
    outline: none;
  }
  .fullscreen-icon {
    font-size: 20px;
    margin: 0 8px;
    font-weight: 600;
    color: #444;
  }
}
.document-editor-wrapper {
  box-sizing: border-box;
  padding: 0 36px 0 12px;
}

@media screen and (max-width: 540px) {
  .document-editor-wrapper {
    padding: 0;
    margin: 0 12px 0 -16px;
  }
}
</style>