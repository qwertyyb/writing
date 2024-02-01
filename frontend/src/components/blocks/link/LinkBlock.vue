<template>
  <a :href="data.href" @click.prevent>
    <text-block v-bind="$attrs" :model-value="block" ref="textBlockRef"></text-block>
  </a>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import TextBlock from '../TextBlock.vue';
import type { BlockModel } from '@/models/block';

const block = defineModel<BlockModel>({ required: true })

const textBlockRef = ref<InstanceType<typeof TextBlock>>()

interface LinkData {
  href: string
}
const data = ref<LinkData>({
  href: block.value?.data?.href ?? ''
})


defineExpose({
  save() {
    return textBlockRef.value?.save()
  }
})
</script>