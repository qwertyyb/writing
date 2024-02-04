<template>
  <blockquote class="block-quote-block">
    <text-block :model-value="data.text"
      :index="0"
      @update:modelValue="update({ text: $event })"></text-block>
  </blockquote>
</template>

<script lang="ts" setup>
import TextBlock from '@/components/blocks/TextBlock.vue'
import { createBlock, type BlockModel } from '@/models/block';
import type { TextData } from '../TextBlock';
import { ref } from 'vue';

const block = defineModel<BlockModel>({ required: true })

interface BlockQuoteData {
  text: BlockModel<TextData>
}

const data = ref<BlockQuoteData>({
  text: block.value?.data.text ?? createBlock({ type: 'text' })
})

const update = (newData: Partial<BlockQuoteData>) => {
  data.value = {
    ...data.value,
    ...newData,
  }
  block.value = {
    ...block.value,
    data: data.value
  }
}

defineExpose({
  save() {
    return data.value
  }
})

</script>

<style lang="less" scoped>
blockquote.block-quote-block {
  margin: 16px 0;
  border-left: 4px solid #dfe2e5;
  padding: 6px 0 6px 16px;
}
</style>