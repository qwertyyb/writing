<template>
  <rich-text-editor v-model="value"></rich-text-editor>
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
      content: {
        text: '这是测试内容1'
      }
    }),
    createBlock({
      id: 'text2',
      type: 'text',
      content: {
        text: '这是测试内容2'
      }
    }),
    createBlock({
      id: 'text3',
      type: 'text',
      content: {
        text: '这是测试内容3'
      }
    })
  ]
}))
</script>

<style>

</style>