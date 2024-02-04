<template>
  <component :is="component"
    v-model="block"
    v-bind="$attrs"
    v-if="block"
    ref="renderer"></component>
</template>

<script lang="ts" setup>
import { type BlockModel, BlockSaveType } from '@/models/block';
import { computed, ref } from 'vue';
import commands from '.';

const block = defineModel<BlockModel>({ required: true })

const renderer = ref()

const component = computed(() => {
  return commands.find(command => command.identifier === block?.value.type)?.component
})

defineExpose({
  blockSaveType: () => {
    return renderer.value?.blockSaveType?.() ?? BlockSaveType.Data
  },
  save() {
    return renderer.value?.save?.() ?? null
  }
})

</script>