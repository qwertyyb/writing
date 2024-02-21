<template>
  <h5 class="block-heading5">
    <text-block v-bind="$attrs"></text-block>
  </h5>
</template>

<script lang="ts" setup>
import TextBlock from '../TextBlock.vue';
</script>

<style lang="less" scoped>
.block-heading5 {
  margin: var(--document-editor-heading5-margin, var(--document-editor-heading-margin, 0.5em 0));
  font-size: var(--document-editor-heading5-font-size);
}
</style>