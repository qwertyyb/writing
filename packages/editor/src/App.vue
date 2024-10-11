<script setup lang="ts">
import { ref, shallowRef } from 'vue';
import DocumentEditor from './editor/DocumentEditor.vue'
import { demo } from './doc'
import { type NodeValue } from './editor/types'

const value = shallowRef<NodeValue>(demo)
const editor = ref<InstanceType<typeof DocumentEditor>>()

const upload = (file: File, options?: { previous?: string }) => {
  return new Promise<string>(resolve => {
    const reader = new FileReader()
    reader.onload = () => {
      resolve(reader.result as string)
    }
    reader.readAsDataURL(file)
  })
}

const changeHandler = (value: any) => {
  console.log('changed: ', value)
}

const importMarkdown = async () => {
  const [fileHandle] = await window.showOpenFilePicker({ types: [{ accept: { 'text/plain': '.md' } }] })
  const text = await (await fileHandle.getFile()).text()
  editor.value?.import(text, 'markdown')
}

const exportMarkdown = async () => {
  const markdown = editor.value?.export('markdown')
  if (!markdown) return null
  const fileHandle = await window.showSaveFilePicker({
    suggestedName: 'demo.md',
    types: [{
      accept: { 'text/plain': ['.md'] }
    }]
  });
  const writable = await fileHandle.createWritable()
  writable.write({ type: 'write', data: markdown })
  writable.close()
}

</script>

<template>
  <main>
    <div class="actions-btn">
      <button @click="importMarkdown">导入 Markdown</button>
      <button @click="exportMarkdown">导出 Markdown</button>
    </div>
    <DocumentEditor v-model="value"
      @update:model-value="changeHandler"
      editable
      :upload="upload"
      ref="editor"
      class="editor"
    ></DocumentEditor>
  </main>
</template>

<style>
body {
  margin: 0;
  padding: 0;
}
</style>

<style lang="less" scoped>
.editor {
  max-width: calc(100vw - 10em);
  margin: 0 auto;
}
.actions-btn {
  margin-block: 20px;
  display: flex;
  & > * {
    margin-left: 20px;
  }
}
</style>
