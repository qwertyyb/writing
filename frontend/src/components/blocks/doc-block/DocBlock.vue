<template>
  <input type="text"
    class="doc-title-input"
    placeholder="此处填写标题"
    :disabled="readonly"
    :value="data.title"
    @input="event => update({ title: (event.target as HTMLInputElement).value })">
</template>

<script lang="ts" setup>
import type { BlockModel } from '@/models/block';
import { useMode } from '@/hooks/mode';
import { ref, watch } from 'vue';

const block = defineModel<BlockModel>({ required: true })

const { readonly } = useMode()

const data = ref({
  title: block.value.data?.title || ''
})

watch(block, () => {
  data.value = {
    title: block.value.data?.title || ''
  }
})

const update = (values: { title: string }) => {
  data.value = {
    ...data.value,
    ...values
  }
  block.value = {
    ...block.value,
    data: data.value
  }
}

</script>

<style lang="less" scoped>
.doc-title-input {
  border: none;
  outline: none;
  font-size: 36px;
  margin-bottom: 18px;
  width: 100%;
  &:disabled {
    background: #fff;
    color: inherit;
  }
}
</style>

<style lang="less">
.block-editor.block-type-doc > .block-children {
  margin-left: 0 !important;
}
</style>