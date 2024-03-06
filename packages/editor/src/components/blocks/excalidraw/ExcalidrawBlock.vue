<template>
  <div class="excalidraw-block">
    <div class="excalidraw-placeholder"
      ref="el"
      :contenteditable="readonly ? undefined : 'true'"
      @keydown.delete.prevent
      v-if="!data.cover?.src">
      <span class="material-symbols-outlined placeholder-icon"
        @click="openEditDialog">
        draw
      </span>
    </div>
    <base-image :model-value="data.cover"
      v-else
      @remove="$emit('remove')"
      @add="$emit('add', $event)"
      @update:model-value="update({ cover: $event })"
    >
      <template v-slot:menu-item-list>
        <span class="material-symbols-outlined settings-icon upload-icon"
          title="编辑"
          @click="openEditDialog">
          draw
        </span>
      </template>
    </base-image>
    <el-dialog v-model="editDialogVisible"
      fullscreen
      title="Excalidraw"
      class="excalidraw-dialog"
      :before-close="beforeCloseHandler"
      destroy-on-close>
      <excalidraw-editor
        :model-value="excalidrawData"
        :upload-state="uploadState"
        @update:model-value="updateExcalidrawData"
        ref="editor"></excalidraw-editor>
    </el-dialog>
  </div>
</template>
<script lang="ts" setup>
import { markRaw, ref, shallowRef, toRaw } from 'vue';
import { useMode } from '../../../hooks/mode'
import { createBlock, type BlockModel } from '../../../models/block'
import { ImageAlign, type ImageData } from '../../../components/schema';
import BaseImage from '../BaseImage.vue';
import ExcalidrawEditor from './ExcalidrawEditor.vue';
import { createImageData } from '../image/utils';
import { useUpload } from '../../../hooks/upload';

declare global {
  interface Window {
    React: any
    ReactDOM: any
    ExcalidrawLib: any
  }
}

interface ExcalidrawData {
  excalidraw: {
    elements: any[],
    files: any
  },
  cover: ImageData
}

const block = defineModel<BlockModel>({ required: true })

const editDialogVisible = ref(false)
const editor = ref<InstanceType<typeof ExcalidrawEditor>>()

const { readonly } = useMode()
const { state: uploadState, uploadBlob } = useUpload()

const data = ref<Partial<ExcalidrawData>>({
  excalidraw: block.value.data?.excalidraw ?? null,
  cover: block.value.data?.cover ?? {
    src: '/images/excalidraw.png',
    ratio: 1280 / 336,
    align: ImageAlign.Center,
    size: 50,
    title: createBlock({
      type: 'text',
      data: {
        html: 'Excalidraw绘图'
      }
    })
  }
})

const excalidrawData = shallowRef(markRaw(toRaw(block.value.data?.excalidraw ?? { elements: [], files: {} })))

const update = (newData: Partial<ExcalidrawData>) => {
  data.value = {
    ...data.value,
    ...newData
  }
  block.value = {
    ...block.value,
    data: data.value
  }
}

const updateExcalidrawData = (newData: any) => {
  // appState不需要保存到数据库
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { appState, ...rest } = newData
  excalidrawData.value = markRaw(newData)
  data.value.excalidraw = markRaw(rest)
  block.value = {
    ...block.value,
    data: data.value
  }
}

const updateCover = async ({ url = '', ratio = 1 }) => {
  data.value.cover = {
    ...(await createImageData(url, ratio)),
    ...data.value.cover,
    src: url,
    ratio,
  }
  block.value = {
    ...block.value,
    data: data.value
  }
}

const openEditDialog = () => {
  editDialogVisible.value = true
}

const beforeCloseHandler = async (done: () => void) => {
  const blob = await editor.value?.exportToBlob()
  done()
  const { url, ratio } = await uploadBlob(blob)
  updateCover({ url, ratio })
}

</script>

<style lang="less" scoped>
.excalidraw-container {
  width: 100%;
}
.excalidraw-placeholder {
  outline: none;
  border: none;
  .placeholder-icon {
    font-size: 48px;
    cursor: pointer;
  }
}
</style>
<style lang="less">
.el-dialog.excalidraw-dialog {
  display: flex;
  flex-direction: column;
  & > .el-dialog__body {
    padding: 0;
    flex: 1;
  }
}
</style>