<template>
  <rich-text-editor v-model="value" ref="editorRef"></rich-text-editor>
  <button @click="submit">提交</button>
</template>

<script lang="ts" setup>
import RichTextEditor from '@/components/RichTextEditor.vue'
import { ref } from 'vue'
import { Block, createBlock } from '@/models/block'

const value = ref<Block>(createBlock({
  id: 'test',
  type: 'doc',
  children: [
    createBlock({
      id: 'text',
      type: 'text',
      data: {
        html: '这是测试内容1'
      }
    }),
    createBlock({
      id: 'text2',
      type: 'text',
      data: {
        html: '这是测试内容2'
      }
    }),
    createBlock({
      id: 'text3',
      type: 'text',
      data: {
        html: '这是测试内容3'
      }
    })
  ]
}))

const editorRef = ref<InstanceType<typeof RichTextEditor>>()

const submit = () => {
  console.log(JSON.parse(JSON.stringify(editorRef.value?.save())))
}

</script>

<style>

</style>