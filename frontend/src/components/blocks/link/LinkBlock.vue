<template>
  <a :href="data.href"
    @click="clickHandler"
    class="link-block"
    :class="{ edit: canEdit }"
    referrerpolicy="strict-origin-when-cross-origin"
    target="_blank"
  >
    <el-popover :width="400" trigger="click"
      :disabled="readonly"
      popper-class="link-popover" ref="popoverEl">
      <template #reference>
        <text-block
          :model-value="data.text"
          @update:modelValue="update({ text: $event })"
          :index="0"
          ref="textBlockRef"></text-block>
      </template>
      <div class="link-content">
        <div>请输入链接</div>
        <el-input size="small" ref="linkInputEl"
          :model-value="data.href"
          @update:modelValue="update({ href: $event })"></el-input>
      </div>
    </el-popover>
  </a>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import TextBlock from '../TextBlock.vue';
import { createBlock, type BlockModel } from '@/models/block';
import type { TextData } from '../TextBlock';
import { ElInput, ElPopover } from 'element-plus';
import { useMode } from '@/hooks/mode';

const block = defineModel<BlockModel>({ required: true })

const { readonly, canEdit } = useMode()

const textBlockRef = ref<InstanceType<typeof TextBlock>>()

interface LinkData {
  href: string,
  text: BlockModel<TextData>
}
const data = ref<LinkData>({
  href: block.value?.data?.href ?? '',
  text: block.value?.data.text ?? createBlock({ type: 'text' })
})

const update = (newData: Partial<LinkData>) => {
  data.value = {
    ...data.value,
    ...newData,
  }
  block.value = {
    ...block.value,
    data: data.value
  }
}

const clickHandler = (event: MouseEvent) => {
  if (canEdit.value) {
    event.preventDefault()
  }
}

defineExpose({
  save() {
    return data.value
  }
})
</script>
<style lang="less" scoped>
.link-block {
  &.edit {
    cursor: text;
  }
}
</style>
<style lang="less">
.el-popover.link-popover {
  z-index: 89 !important;
}
</style>