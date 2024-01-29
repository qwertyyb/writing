<template>
  <rich-text-editor v-model="value"></rich-text-editor>
</template>

<script lang="ts" setup>
import RichTextEditor from '@/components/RichTextEditor.vue'
import { ref } from 'vue'
import { BlockModel } from '@/models/block'

const value = ref<BlockModel>(new BlockModel({
  id: 'test',
  type: 'doc',
  children: [
    new BlockModel({
      id: 'text',
      type: 'text',
      content: {
        text: '这是测试内容1'
      }
    }),
    new BlockModel({
      id: 'text2',
      type: 'text',
      content: {
        text: '这是测试内容2'
      }
    }),
    new BlockModel({
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