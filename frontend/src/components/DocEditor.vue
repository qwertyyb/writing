<template>
  <rich-text-editor v-model="value" ref="editorRef" @change="changeHandler"></rich-text-editor>
</template>

<script lang="ts" setup>
import RichTextEditor from '@/components/RichTextEditor.vue'
import { ref } from 'vue'
import { type BlockModel, createBlock } from '@/models/block'

const value = ref<BlockModel>(createBlock({
  type: 'doc',
  children: [
    createBlock({
      data: {
        html: '这是测试内容1'
      }
    }),
    createBlock({
      data: {
        html: '这是测试内容2'
      }
    }),
    createBlock({
      data: {
        html: '这是测试内容3'
      }
    })
  ]
}))

const editorRef = ref<InstanceType<typeof RichTextEditor>>()

const changeHandler = (value: BlockModel) => {
  console.log(value)
}

</script>

<style>

</style>