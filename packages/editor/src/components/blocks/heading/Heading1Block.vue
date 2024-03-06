<template>
  <h1 class="block-heading1">
    <text-block v-bind="$attrs"></text-block>
  </h1>
</template>

<script lang="ts" setup>
import TextBlock from '../TextBlock.vue';
</script>

<style lang="less" scoped>
.block-heading1 {
  margin: var(--document-editor-heading1-margin, var(--document-editor-heading-margin, 0.5em 0));
  &:deep(.text-block) .ql-editor p {
    font-size: var(--document-editor-heading1-font-size);
  }
}
</style>