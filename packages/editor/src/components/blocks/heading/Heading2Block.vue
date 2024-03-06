<template>
  <h2 class="block-heading2">
    <text-block v-bind="$attrs"></text-block>
  </h2>
</template>

<script lang="ts" setup>
import TextBlock from '../TextBlock.vue';
</script>

<style lang="less" scoped>
.block-heading2 {
  margin: var(--document-editor-heading2-margin, var(--document-editor-heading-margin, 0.5em 0));
  &:deep(.text-block) .ql-editor p {
    font-size: var(--document-editor-heading2-font-size);
  }
}
</style>