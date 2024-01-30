<template>
  <ul ref="el">
    <li v-for="(child, index) in block.children" :key="child.id">
      <text-renderer
        :block="child"
        :index="index"
        :parent="parent"
        ref="blockRefs"
        @add="addBlock($event, child, index)"
        @update="updateBlock($event, child, index)"
        @remove="removeBlock(block, index)"
      ></text-renderer>
    </li>
  </ul>
</template>

<script lang="ts" setup>
import TextRenderer from '../TextRenderer.vue';
import type { Block } from '@/models/block';
import useBlockOperate from '@/components/block-operate';
import { computed } from 'vue';

const props = defineProps<{
  block: Block,
  index: number,
  parent: Block,
}>()

const block = computed(() => props.block)

const { el, blockRefs, addBlock, updateBlock, removeBlock, save } = useBlockOperate(block)

addBlock({
  type: 'text',
  id: Math.random().toString(16).substring(2)
}, props.block, 0)

defineExpose({
  save
})
</script>