<template>
  <h2>
    <text-renderer v-bind="$attrs" ref="textRenderRef"></text-renderer>
  </h2>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import TextRenderer from '../TextRenderer.vue';

const textRenderRef = ref<InstanceType<typeof TextRenderer>>()

defineExpose({
  save() {
    return textRenderRef.value?.save()
  }
})
</script>