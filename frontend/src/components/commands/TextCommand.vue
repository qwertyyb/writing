<template>
  <div class="text-component" v-html="block.content.text ?? block.content"></div>
</template>

<script lang="ts" setup>
import { BlockModel } from '@/models/block';

const props = defineProps({
  block: {
    type: BlockModel,
    required: true,
  }
})
</script>

<style lang="less">
</style>