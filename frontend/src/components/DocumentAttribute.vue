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
import { computed } from 'vue';
import { encode } from 'universal-base64url';
import { randomString } from '@/utils/utils';
import type { Attribute } from '@/services/types';

const props = defineProps<{
  docId: number,
  attributes: Attribute[],
}>()

const emits = defineEmits<{
  change: [attributes: Omit<Attribute, 'docId'>[]]
}>()

const shareId = computed(() => props.attributes.find(attr => attr.key === 'share')?.value)
const shareLink = computed(() => location.origin + '/public/' + shareId.value)

const changeHandler = async (shared: boolean) => {
  let value = ''
  if (shared) {
    value = encode(props.docId.toString() + randomString(8))
  }
  emits('change', [{ key: 'share', value }])
}

</script>
<style lang="less" scoped>
.form-item-content {
  display: flex;
  flex-direction: column;
  .share-link {
    word-break: break-all;
  }
}
</style>