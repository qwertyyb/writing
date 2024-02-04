<template>
  <base-list-block v-bind="$attrs" tag="ol" ref="baseLinkBlockRef"></base-list-block>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import BaseListBlock from './BaseListBlock.vue';

const baseLinkBlockRef = ref<InstanceType<typeof BaseListBlock>>()

defineExpose({
  blockSaveType: () => {
    return baseLinkBlockRef.value?.blockSaveType()
  },
  save: () => baseLinkBlockRef.value?.save()
})
</script>