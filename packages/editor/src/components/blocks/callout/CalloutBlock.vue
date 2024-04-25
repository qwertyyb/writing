<template>
  <div class="callout-block">
    <div class="callout-icon">💡</div>
    <div class="callout-content">
      <text-block
        :model-value="data.text"
        :index="0"
        @add="$emit('add', $event)"
        @update:modelValue="update({ 'text': $event })"
      ></text-block>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import { type BlockModel, createBlock } from '../../../models/block';
import { TextData } from '../../schema';
import TextBlock from '../TextBlock.vue';

defineEmits<{
  remove: [],
  add: [options?: Partial<BlockModel>]
}>();

interface CalloutData {
  text: BlockModel<TextData>
  icon: string
}

const block = defineModel<BlockModel<CalloutData>>({ required: true });

const data = ref<CalloutData>({
  text: block.value.data?.text ?? createBlock({ type: 'text', data: { ops: [] } }),
  icon: block.value.data?.icon ?? '💡'
});

const update = (newData: Partial<CalloutData>) => {
  data.value = {
    ...data.value,
    ...newData
  };
  block.value = {
    ...block.value,
    data: data.value
  };
};

</script>

<style lang="less" scoped>
.callout-block {
  display: flex;
  padding: 16px 16px 16px 12px;
  background: rgb(241, 241, 239);
  border-radius: 4px;
  .callout-icon {
    font-size: 22px;
  }
  .callout-content {
    margin-left: 8px;
    flex: 1;
  }
}
</style>