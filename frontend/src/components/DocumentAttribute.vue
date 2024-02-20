<template>
  <div class="document-attribute">
    分享<el-switch :model-value="shared" @change="changeHandler"></el-switch>
  </div>
</template>
<script lang="ts" setup>
import { setAttributes } from '@/services/attribute'
import { computed } from 'vue';
const props = defineProps<{
  docId: number,
  attributes: { key: string, value: string }[]
}>()

const shared = computed(() => props.attributes.some(attr => attr.key === 'share' && attr.value))

const changeHandler = (shared: boolean) => {
  setAttributes(props.docId, [{ key: 'share', value: shared ? '111111' : '' }])
}

</script>