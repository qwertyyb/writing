<template>
  <a :href="data.href"
    @click="clickHandler"
    class="link-block"
    :class="{ edit: canEdit, readonly }"
    referrerpolicy="strict-origin-when-cross-origin"
    target="_blank"
    rel="noopener"
  >
    <el-popover :width="400" trigger="click"
      :disabled="readonly"
      popper-class="link-popover" ref="popoverEl">
      <template #reference>
        <text-block
          :model-value="data.text"
          @add="$emit('add')"
          @update:modelValue="update({ text: $event })"
          :index="0"></text-block>
      </template>
      <div class="link-content">
        <div>请输入链接</div>
        <el-input size="small" ref="linkInputEl"
          :model-value="data.href"
          @update:modelValue="update({ href: $event })"></el-input>
        <el-button size="small" @click="openLink">查看</el-button>
      </div>
    </el-popover>
  </a>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import TextBlock from '../TextBlock.vue';
import { createBlock, type BlockModel } from '../../../models/block';
import { ElInput, ElPopover } from 'element-plus';
import { useMode } from '../../../hooks/mode';

const block = defineModel<BlockModel>({ required: true });

const emits = defineEmits<{
  add: [options?: Partial<BlockModel>],
}>();

const { readonly, canEdit } = useMode();

interface LinkData {
  href: string,
  text: BlockModel
}
const data = ref<LinkData>({
  href: block.value?.data?.href ?? '',
  text: block.value?.data.text ?? createBlock({ type: 'text' })
});

const update = (newData: Partial<LinkData>) => {
  if (newData.text && newData.text?.type !== 'text') {
    return emits('add', { type: newData.text!.type });
  }
  data.value = {
    ...data.value,
    ...newData,
  };
  block.value = {
    ...block.value,
    data: data.value
  };
};

const clickHandler = (event: MouseEvent) => {
  if (canEdit.value) {
    event.preventDefault();
  }
};

const openLink = () => {
  window.open(data.value.href, '_blank', 'noreferrer');
};

defineExpose({
  save() {
    return data.value;
  }
});
</script>
<style lang="less" scoped>
.link-block {
  &.edit {
    cursor: text;
  }
  &.readonly :deep(*) {
    display: inline;
  }
}
</style>
<style lang="less">
.el-popover.link-popover {
  z-index: 89 !important;
}
</style>