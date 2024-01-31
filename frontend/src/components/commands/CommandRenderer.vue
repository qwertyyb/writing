<template>
  <component :is="component"
    :block="block"
    v-bind="$attrs"
    v-if="block" ref="renderer"></component>
</template>

<script lang="ts" setup>
import { Block } from '@/models/block';
import { computed, ref } from 'vue';
import commands from '.';

const props = defineProps({
  block: {
    type: Block,
    rquired: true
  },
})

const renderer = ref()

const component = computed(() => {
  return commands.find(command => command.identifier === props.block?.type)?.component
})

defineExpose({
  blockType: () => {
    return renderer.value?.blockType?.() ?? 'data'
  },
  save() {
    return renderer.value?.save()
  }
})

</script>