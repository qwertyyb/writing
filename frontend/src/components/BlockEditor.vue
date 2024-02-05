<template>
  <div class="block-editor" :data-block-id="block.id" ref="el">
    <!-- <div class="block-tool">
      <span class="material-symbols-outlined block-tool-icon"> drag_indicator </span>
    </div> -->
    <div class="block-content">
      <command-renderer
        v-bind="$attrs"
        v-model="block"
        :index="index"
        :parent="parent"
        :path="path"
        ref="renderRef"></command-renderer>
    </div>
    <div class="block-children">
      <block-list-editor
        v-model="block"
        @addAfter="$emit('addAfter', $event)"
        :path="path"
        :index="index"></block-list-editor>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { type BlockModel, BlockSaveType } from '@/models/block';
import { ref } from 'vue';
import CommandRenderer from './commands/CommandRenderer.vue';
import BlockListEditor from './BlockListEditor.vue';

const block = defineModel<BlockModel>({ required: true })

const props = defineProps<{
  index: number,
  path: number[],
  parent?: BlockModel
}>()

const el = ref<HTMLDivElement>()
const renderRef = ref<InstanceType<typeof CommandRenderer>>()

defineExpose({
  save() {
    if (renderRef.value?.blockSaveType() === BlockSaveType.Data) {
      return {
        ...block.value,
        data: renderRef.value?.save()
      }
    } else {
      return renderRef.value?.save()
    }
  }
})


</script>

<style lang="less" scoped>
.block-editor {
  display: flex;
  align-items: flex-start;
  justify-content: flex-start;
  flex-direction: column;
  & > * {
    width: 100%;
  }
  & > .block-children {
    margin-left: 28px;
  }
  &:hover, &focus-within {
    .block-tool {
      opacity: 1;
    }
  }
  .block-tool {
    width: 24px;
    height: 24px;
    cursor: pointer;
    opacity: 0;
  }
  .block-tool-icon {
    font-size: 24px;
    user-select: none;
    color: rgb(190, 190, 190);
    font-weight: 300;
    border-radius: 4px;
    transition: background .2s;
    &:hover {
      background: rgba(230, 230, 230);
    }
  }
  .block-content {
    flex: 1;
  }
}
</style>