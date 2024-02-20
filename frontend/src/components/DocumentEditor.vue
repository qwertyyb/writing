<template>
  <rich-text-editor v-model="document"
    v-bind="$attrs"
    ref="editorRef"
    @update:model-value="changeHandler"></rich-text-editor>
</template>

<script lang="ts" setup>
import RichTextEditor from '@/components/RichTextEditor.vue'
import { ref } from 'vue'
import { type BlockModel } from '@/models/block'
import { debounce } from '@/utils/utils';
import { logger } from '@/utils/logger';

const document = defineModel<BlockModel>({ required: true, })

const emits = defineEmits<{
  'change': [value: BlockModel]
}>()

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