<template>
  <h4 class="block-heading4">
    <text-block v-bind="$attrs"></text-block>
  </h4>
</template>

<script lang="ts" setup>
import TextBlock from '../TextBlock.vue';
</script>

<style lang="less" scoped>
.block-heading4 {
  margin: var(--document-editor-heading4-margin, var(--document-editor-heading-margin, 0.5em 0));
  &:deep(.text-block) .ql-editor p {
    font-size: var(--document-editor-heading4-font-size);
  }
}
</style>