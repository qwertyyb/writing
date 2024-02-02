<template>
  <div class="rich-text-editor" ref="el">
    <div class="block-list">
      <block-editor v-for="(child, index) in model.children"
        :key="child.id + child.type"
        :model-value="child"
        :index="index"
        :parent="model"
        @update:modelValue="updateBlock($event, child, index)"
        @add="addBlock($event, child, index)"
        @update="updateBlock($event, child, index)"
        @remove="removeBlock(child, index)"
        :ref="el => setBlockRef(child.id, el as any)"
      ></block-editor>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { createBlock, type BlockModel } from '@/models/block';
import BlockEditor from './BlockEditor.vue';
import useBlockOperate from './block-operate';
import { useFocusEvent } from '@/hooks/focus';
import { provide, type PropType, computed } from 'vue';
import { Mode } from './schema';

const model = defineModel<ReturnType<typeof createBlock>>({
  required: true
})
const props = defineProps({
  mode: {
    type: String as PropType<Mode>,
    default: Mode.Edit
  },
  spellcheck: {
    type: Boolean,
    default: false
  }
})

const mode = computed(() => props.mode)
const spellcheck = computed(() => props.spellcheck)

provide('mode', mode)
provide('spellcheck', spellcheck)

const emits = defineEmits<{
  added: [{ block: BlockModel, index: number, parent?: BlockModel }],
  updated: [{ oldBlock: BlockModel, block: BlockModel, index: number, parent?: BlockModel }],
  removed: [{ block: BlockModel, index: number, parent?: BlockModel }],
  change: [BlockModel],
  'update:modelValue': [BlockModel]
}>()

const { el, setBlockRef, addBlock, updateBlock, removeBlock, save } = useBlockOperate(model, emits)

useFocusEvent()

defineExpose({
  save
})
</script>

<style scoped>
.rich-text-editor {
  min-width: 50vw;
  min-height: 50vh;
  position: relative;
}
</style>