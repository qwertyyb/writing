<template>
  <h5>
    <text-renderer v-bind="$attrs" ref="textRenderRef"></text-renderer>
  </h5>
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