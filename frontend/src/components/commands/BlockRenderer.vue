<template>
  <component :is="component"
    v-model="block"
    v-bind="$attrs"
    v-if="block"
    ref="renderer"></component>
</template>

<script lang="ts" setup>
import { type BlockModel } from '@/models/block';
import { computed } from 'vue';
import commands from '.';

const block = defineModel<BlockModel>({ required: true })

const component = computed(() => {
  return commands.find(command => command.identifier === block?.value.type)?.component
})
</script>