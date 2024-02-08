<template>
  <el-switch v-model="config.mode"
    active-text="只读模式"
    inactive-text="编辑模式"
    :active-value="Mode.Readonly"
    :inactive-value="Mode.Edit"></el-switch>
  <el-switch v-model="config.spellcheck"
    active-text="开启拼写检查"
    inactive-text="关闭拼写检查"></el-switch>
  <rich-text-editor v-model="document"
    :mode="config.mode"
    :spellcheck="config.spellcheck"
    ref="editorRef"
    @update:model-value="changeHandler"></rich-text-editor>
</template>

<script lang="ts" setup>
import RichTextEditor from '@/components/RichTextEditor.vue'
import { ref } from 'vue'
import { type BlockModel } from '@/models/block'
import { Mode } from './schema';
import { debounce } from '@/utils/utils';
import { logger } from '@/utils/logger';

const document = defineModel<BlockModel>({ required: true, })

const emits = defineEmits<{
  'change': [value: BlockModel]
}>()

const config = ref({
  mode: Mode.Edit,
  spellcheck: false
})

const editorRef = ref<InstanceType<typeof RichTextEditor>>()

const callback = debounce((value: BlockModel) => {
  logger.i('changed', value)
  document.value = value
  emits('change', value)
})

const changeHandler = (value: BlockModel) => {
  callback(value)
}

</script>

<style>

</style>