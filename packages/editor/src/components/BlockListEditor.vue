<template>
  <div class="block-list-editor" ref="el">
    <div class="block-list">
      <block-editor v-for="(child, index) in children"
        :key="child.id + child.type"
        :data-block-id="child.id"
        :data-block-path="[...path, index].join(',')"
        :model-value="child"
        :index="index"
        :path="[...path, index]"
        @update:modelValue="$emit('update', index, $event)"
        @add="$emit('add', index, $event)"
        @remove="$emit('remove', index)"
      ></block-editor>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { createBlock, type BlockModel } from '../models/block';
import BlockEditor from './BlockEditor.vue';
import { type PropType } from 'vue';

const children = defineModel<ReturnType<typeof createBlock>[]>({
  required: true
});

defineProps({
  index: {
    type: Number,
    default: 0
  },
  path: {
    type: Array as PropType<number[]>,
    default: () => [0]
  }
});

defineEmits<{
  add: [index: number, options: Partial<BlockModel>],
  remove: [index: number],
  update: [index: number, options: Partial<BlockModel>]
}>();

</script>

<style scoped>
.rich-text-editor {
  min-width: 50vw;
  min-height: 50vh;
  position: relative;
}
</style>