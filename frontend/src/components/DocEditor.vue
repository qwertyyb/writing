<template>
  <rich-text-editor v-model="defaultValue"
    ref="editorRef"
    @change="changeHandler"></rich-text-editor>
</template>

<script lang="ts" setup>
import RichTextEditor from '@/components/RichTextEditor.vue'
import { ref, toRaw } from 'vue'
import { type BlockModel, createBlock } from '@/models/block'

const getDefaultValue = () => {
  let value = createBlock({
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
  })
  try {
    value = JSON.parse(localStorage.getItem('test-doc') || '')
  } catch (err: any) {
    console.log('fallback default value')
  }
  return value
}

const defaultValue = ref<BlockModel>(getDefaultValue())

const editorRef = ref<InstanceType<typeof RichTextEditor>>()

const changeHandler = (value: BlockModel) => {
  console.log('changed', toRaw(value))
  localStorage.setItem('test-doc', JSON.stringify(value))
}

</script>

<style>

</style>