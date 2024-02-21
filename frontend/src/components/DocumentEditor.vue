<template>
  <rich-text-editor v-model="document"
    v-bind="$attrs"
    ref="editorRef"
    class="document-editor"
    @update:model-value="changeHandler"></rich-text-editor>
</template>

<script lang="ts" setup>
import RichTextEditor from '@/components/RichTextEditor.vue'
import { ref } from 'vue'
import { type BlockModel } from '@/models/block'
import { debounce } from '@/utils/utils';
import { createLogger } from '@/utils/logger';

const logger = createLogger('document-editor')

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

<style lang="less">
.document-editor {
  --document-editor-title-font-size: 36px;
  --document-editor-title-font-weight: bolder;
  --document-editor-title-color: #000;
  --document-editor-title-margin: 0 0 18px 0;

  // heading
  --document-editor-heading-margin: 0.1em 0;
  --document-editor-heading1-font-size: 32px;
  --document-editor-heading2-font-size: 28px;
  --document-editor-heading3-font-size: 24px;
  --document-editor-heading4-font-size: 22px;
  --document-editor-heading5-font-size: 18px;
  --document-editor-heading6-font-size: 16px;
}
</style>