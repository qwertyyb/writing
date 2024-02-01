<template>
  <h3>
    <text-block v-bind="$attrs" ref="textBlockRef"></text-block>
  </h3>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import TextBlock from '../TextBlock.vue';

const textBlockRef = ref<InstanceType<typeof TextBlock>>()

defineExpose({
  save() {
    return textBlockRef.value?.save()
  }
})
</script>