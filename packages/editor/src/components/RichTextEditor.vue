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
      <block-editor :model-value="model"
        :index="0"
        :path="[]"
        :key="model.id"
        @pointermove="pointermoveHandler"></block-editor>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { createBlock, type BlockModel } from '../models/block';
import BlockEditor from './BlockEditor.vue';
import { focusBlock } from '../hooks/focus';
import { provide, type PropType, computed, ref, shallowRef, toRaw, watch } from 'vue';
import { Mode } from './schema';
import { useHistory } from '../hooks/history';
import { useBlockTool } from '../hooks/use-block-tool';
import { useSelection } from '../hooks/selection';
import EditorToolbar from './tool/EditorToolbar.vue';
import { createLogger } from '@writing/utils/logger';
import { BlockTree, rootSymbol } from '../models/BlockTree';
import { uploadSymbol } from '../utils/upload'

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
  },
  upload: {
    type: Function as PropType<(file: Blob | File) => Promise<string>>
  }
})

defineEmits<{
  'update:modelValue': [BlockModel]
}>()

const el = ref<HTMLElement>()
const editorEl = ref<HTMLDivElement>()
const rootValue = shallowRef(new BlockTree(model.value))

const mode = computed(() => props.mode)
const spellcheck = computed(() => props.spellcheck)

provide('mode', mode)
provide('spellcheck', spellcheck)
provide(uploadSymbol, props.upload)
provide(rootSymbol, rootValue)

const { selection, pointermoveHandler: selectionTrigger } = useSelection({ el: editorEl })

const { state: blockToolState, pointermoveHandler: blockToolTrigger } = useBlockTool({
  el, mode
})

const { undo, redo, pushLatest } = useHistory(el, model)

rootValue.value.on('change', (value, changes) => {
  logger.i('change', value, changes)
  model.value = value
  pushLatest()
})

rootValue.value.on('added', ({ block }) => {
  focusBlock(block.id, 'start')
})
rootValue.value.on('updated', ({ oldBlock, block }) => {
  if (oldBlock.type + oldBlock.id !== block.type + block.id) {
    focusBlock(block.id)
  }
})
rootValue.value.on('removed', ({ path }) => {
  const prev = rootValue.value.getPrev(path)
  if (prev) {
    focusBlock(prev.block.id)
  }
})

watch(model, (value) => {
  rootValue.value.updateModel(value)
})

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