<template>
  <component :is="component"
    :block="block"
    v-bind="$attrs"
    v-if="block" ref="renderer"></component>
</template>

<script lang="ts" setup>
import { type BlockModel, BlockSaveType } from '@/models/block';
import { computed, ref } from 'vue';
import commands from '.';

const props = defineProps<{
  block: BlockModel
}>()

const renderer = ref()

const component = computed(() => {
  return commands.find(command => command.identifier === props.block?.type)?.component
})

defineExpose({
  blockSaveType: () => {
    return renderer.value?.blockSaveType?.() ?? BlockSaveType.Data
  },
  save() {
    return renderer.value?.save()
  }
})

</script>