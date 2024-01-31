<template>
  <div class="image-block">
    <!-- <input type="file" accept="image/*" contenteditable> -->
    <img src="https://via.placeholder.com/60" />
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import type { BlockModel } from '@/models/block';
import TextRenderer from '../TextRenderer.vue';

const props = defineProps<{
  block: BlockModel,
}>()

const textRenderRef = ref<InstanceType<typeof TextRenderer>>()

defineExpose({
  save() {
    return textRenderRef.value?.save()
  }
})
</script>