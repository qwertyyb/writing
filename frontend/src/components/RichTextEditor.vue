<template>
  <div class="rich-text-editor" ref="el">
    <div class="block-tool"
      v-if="mode === Mode.Edit && blockToolState.visible"
      :style="{left: blockToolState.left + 'px', top: blockToolState.top + 'px'}">
      <span class="material-symbols-outlined block-tool-icon"> drag_indicator </span>
    </div>
    <editor-toolbar
      :root="model"
      :selection="selection"></editor-toolbar>
    <div class="rich-text-editor-wrapper"
      ref="editorEl"
      @keydown.capture="keydownHandler"
      tabindex="0"
      :contenteditable="mode === Mode.Readonly ? undefined : 'plaintext-only'">
      <block-editor v-model="model"
        @update:model-value="updateHandler"
        :index="0"
        :path="[0]"
        :key="model.id"
        @pointermove="pointermoveHandler"></block-editor>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { createBlock, type BlockModel } from '@/models/block';
import BlockEditor from './BlockEditor.vue';
import { useFocusEvent } from '@/hooks/focus';
import { provide, type PropType, computed, ref } from 'vue';
import { Mode } from './schema';
import { useHistory } from '@/hooks/history';
import { useBlockTool } from '@/hooks/use-block-tool';
import { useSelection } from '@/hooks/selection';
import EditorToolbar from './tool/EditorToolbar.vue';
import { createLogger } from '@/utils/logger';

const logger = createLogger('RichTextEditor')

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

defineEmits<{
  'update:modelValue': [BlockModel]
}>()

const el = ref<HTMLElement>()
const editorEl = ref<HTMLDivElement>()

const mode = computed(() => props.mode)
const spellcheck = computed(() => props.spellcheck)

provide('mode', mode)
provide('spellcheck', spellcheck)
provide('root', model)
provide('blockInstances', new Map())

useFocusEvent()

const { state: blockToolState, pointermoveHandler: blockToolTrigger } = useBlockTool({
  el, mode
})

const { undo, redo, pushLatest } = useHistory(el, model)

const { selection, pointermoveHandler: selectionTrigger } = useSelection({ el, root: model })

const pointermoveHandler = (event: PointerEvent) => {
  selectionTrigger(event)
  blockToolTrigger(event)
}

const keydownHandler = (event: KeyboardEvent) => {
  // 仅用来处理多选和历史
  // const selection = getSelectionPosition(el.value!)
  // resetContenteditable()
  // selection && setSelectionPosition(el.value!, selection)
  // 处理历史 undo/redo
  if (event.metaKey && event.key === 'z' && event.shiftKey) {
    event.preventDefault()
    event.stopImmediatePropagation()
    event.stopPropagation()
    redo()
  } else if (event.metaKey && event.key === 'z') {
    event.preventDefault()
    event.stopImmediatePropagation()
    event.stopPropagation()
    undo()
  }
}

const updateHandler = (value: BlockModel) => {
  logger.i('updateHandler', JSON.parse(JSON.stringify(value)))
  pushLatest()
}
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