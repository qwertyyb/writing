<template>
  <h3 class="block-heading3">
    <text-block v-bind="$attrs"></text-block>
  </h3>
</template>

<script lang="ts" setup>
import TextBlock from '../TextBlock.vue';
</script>

<style lang="less" scoped>
.block-heading3 {
  margin: var(--document-editor-heading3-margin, var(--document-editor-heading-margin, 0.5em 0));
  &:deep(.text-block) .ql-editor p {
    font-size: var(--document-editor-heading3-font-size);
  }
}
</style>