<template>
  <component :is="component" :block="block"></component>
</template>

<script lang="ts" setup>
import { Block } from '@/models/block';
import TextCommand from './TextCommand.vue';
import { computed, type Component } from 'vue';

const props = defineProps({
  block: {
    type: Block,
    rquired: true
  }
})

const component = computed(() => {
  const components: Record<string, Component> = {
    text: TextCommand,
  }
  return props.block?.type ? components[props.block.type] : components.text
})

</script>