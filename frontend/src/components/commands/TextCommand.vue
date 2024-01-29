<template>
  <div class="text-component" v-html="block.content.text ?? block.content"></div>
</template>

<script lang="ts" setup>
import { Block } from '@/models/block';

const props = defineProps({
  block: {
    type: Block,
    required: true,
  }
})
</script>

<style lang="less">
</style>