<template>
  <h6 class="block-heading6">
    <text-block v-bind="$attrs"></text-block>
  </h6>
</template>

<script lang="ts" setup>
import TextBlock from '../TextBlock.vue';
</script>

<style lang="less" scoped>
.block-heading6 {
  margin: var(--document-editor-heading6-margin, var(--document-editor-heading-margin, 0.5em 0));
  &:deep(.text-block) .ql-editor p {
    font-size: var(--document-editor-heading6-font-size);
  }
}
</style>