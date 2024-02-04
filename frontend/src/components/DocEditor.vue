<template>
  <el-switch v-model="config.mode"
    active-text="只读模式"
    inactive-text="编辑模式"
    :active-value="Mode.Readonly"
    :inactive-value="Mode.Edit"></el-switch>
  <el-switch v-model="config.spellcheck"
    active-text="开启拼写检查"
    inactive-text="关闭拼写检查"></el-switch>
  <rich-text-editor v-model="defaultValue"
    :mode="config.mode"
    :spellcheck="config.spellcheck"
    ref="editorRef"
    @change="changeHandler"></rich-text-editor>
</template>

<script lang="ts" setup>
import RichTextEditor from '@/components/RichTextEditor.vue'
import { ref } from 'vue'
import { type BlockModel, createBlock } from '@/models/block'
import { Mode } from './schema';
import { debounce } from '@/utils/utils';

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

const config = ref({
  mode: Mode.Edit,
  spellcheck: false
})

const editorRef = ref<InstanceType<typeof RichTextEditor>>()

const callback = debounce((value: BlockModel) => {
  console.log('changed', value)
  localStorage.setItem('test-doc', JSON.stringify(value))
})

const changeHandler = (value: BlockModel) => {
  callback(value)
}

</script>

<style>

</style>