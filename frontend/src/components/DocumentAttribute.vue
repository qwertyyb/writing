<template>
  <div class="document-attribute">
    <el-form>
      <el-form-item label="分享">
        <div class="form-item-content">
          <el-switch :model-value="!!shareId" @change="changeHandler"></el-switch>
          <div v-if="shareId">
            分享链接: <a :href="`/public/${shareId}`" class="share-link" target="_blank">{{ shareLink }}</a>
          </div>
        </div>
      </el-form-item>
    </el-form>
  </div>
</template>
<script lang="ts" setup>
import { type Attribute } from '@/services/attribute'
import { computed } from 'vue';
import base62 from '@/utils/base62';

const props = defineProps<{
  docId: number,
  attributes: Attribute[],
}>()

const emits = defineEmits<{
  change: [attributes: Attribute[]]
}>()

const shareId = computed(() => props.attributes.find(attr => attr.key === 'share')?.value)
const shareLink = computed(() => location.origin + '/public/' + shareId.value)

const changeHandler = async (shared: boolean) => {
  let value = ''
  if (shared) {
    value = base62.encode(new TextEncoder().encode(props.docId.toString().padStart(8, '0')))
  }
  emits('change', [{ key: 'share', value }])
}

</script>
<style lang="less" scoped>
.form-item-content {
  display: flex;
  flex-direction: column;
}
</style>