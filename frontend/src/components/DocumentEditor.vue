<template>
  <rich-text-editor v-model="document"
    v-bind="$attrs"
    class="document-editor"></rich-text-editor>
</template>

<script lang="ts" setup>
import RichTextEditor from '@/components/RichTextEditor.vue'
import { type BlockModel } from '@/models/block'

const document = defineModel<BlockModel>({ required: true, })
</script>

<style lang="less">
.document-editor {
  --document-editor-title-font-size: 36px;
  --document-editor-title-font-weight: bolder;
  --document-editor-title-color: #000;
  --document-editor-title-margin: 0 0 18px 28px;

  // heading
  --document-editor-heading-margin: 0.1em 0;
  --document-editor-heading1-font-size: 32px;
  --document-editor-heading2-font-size: 28px;
  --document-editor-heading3-font-size: 24px;
  --document-editor-heading4-font-size: 22px;
  --document-editor-heading5-font-size: 18px;
  --document-editor-heading6-font-size: 16px;

  --document-editor-inline-bg-color: rgba(175,184,193,0.2);
}
</style>