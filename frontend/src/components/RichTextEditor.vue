<template>
  <div class="rich-text-editor" ref="el">
    <div class="block-tool"
      v-if="mode === Mode.Edit"
      :style="{left: toolPos.left + 'px', top: toolPos.top + 'px'}">
      <span class="material-symbols-outlined block-tool-icon"> drag_indicator </span>
    </div>
    <div class="rich-text-editor-wrapper" :contenteditable="mode === Mode.Readonly ? undefined : 'plaintext-only'">
      <block-editor v-model="model" :index="0" :path="[0]" :key="model.id" @pointermove="pointerMoveHandler"></block-editor>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { createBlock, type BlockModel } from '@/models/block';
import BlockEditor from './BlockEditor.vue';
import { useFocusEvent } from '@/hooks/focus';
import { provide, type PropType, computed, ref } from 'vue';
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

const el = ref<HTMLDivElement>()
const toolPos = ref({
  top: 0,
  left: -28
})

const mode = computed(() => props.mode)
const spellcheck = computed(() => props.spellcheck)

provide('mode', mode)
provide('spellcheck', spellcheck)
provide('root', model)
provide('blockInstances', new Map())

const emits = defineEmits<{
  change: [BlockModel],
  'update:modelValue': [BlockModel]
}>()

useFocusEvent()

const pointerMoveHandler = (event: PointerEvent) => {
  if (mode.value === Mode.Readonly) return
  const blockEl = (event.target as HTMLElement).closest('[data-block-id]')
  if (!blockEl) return
  const blockContentEl = blockEl.querySelector<HTMLDivElement>('.block-content')
  if (!blockContentEl) return
  const { left } = blockEl.getBoundingClientRect()
  const { top, height } = blockContentEl.getBoundingClientRect()
  const { top: pTop, left: pLeft } = el.value!.getBoundingClientRect()
  const tTop = top - pTop + (height - 24) / 2
  const tLeft = left - pLeft - 28
  toolPos.value = {
    top: tTop, left: tLeft
  }
}

// useFocus()
</script>

<style lang="less" scoped>
.rich-text-editor {
  min-width: 50vw;
  min-height: 50vh;
  position: relative;
  .block-tool {
    width: 24px;
    height: 24px;
    cursor: pointer;
    opacity: 0.8;
    position: absolute;
    z-index: 1;
    top: 0;
    left: -28px;
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
  .rich-text-editor-wrapper {
    border: none;
    outline: none;
    padding-bottom: 40vh;
    user-select: text;
  }
}
</style>