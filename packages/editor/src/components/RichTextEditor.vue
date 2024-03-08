<template>
  <div class="rich-text-editor" ref="el">
    <div class="block-tool"
      v-if="mode === Mode.Edit && blockToolState.visible"
      :style="{left: blockToolState.left + 'px', top: blockToolState.top + 'px'}">
      <span class="material-symbols-outlined block-tool-icon"> drag_indicator </span>
    </div>
    <editor-toolbar
      v-if="mode === Mode.Edit"
      :root="model"
      :selection="selectionState"></editor-toolbar>
    <div class="rich-text-editor-wrapper"
      ref="editorEl"
      @keydown.capture="keydownHandler"
      tabindex="0"
      :contenteditable="mode === Mode.Readonly ? undefined : 'plaintext-only'">
      <block-editor :model-value="model"
        :index="0"
        :path="[]"
        :key="model.id"
        @update:model-value="rootValue.updateModel($event)"
        @pointermove="pointermoveHandler"></block-editor>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { createBlock, type BlockModel } from '../models/block';
import BlockEditor from './BlockEditor.vue';
import { focusBlock } from '../hooks/focus';
import { provide, type PropType, computed, ref, shallowRef, watch, onMounted, onBeforeUnmount } from 'vue';
import { Mode } from './schema';
import { useHistory } from '../hooks/history';
import { useBlockTool } from '../hooks/use-block-tool';
import { useSelection } from '../hooks/selection';
import EditorToolbar from './tool/EditorToolbar.vue';
import { createLogger } from '@writing/utils/logger';
import { BlockTree, rootSymbol } from '../models/BlockTree';
import { uploadSymbol } from '../utils/upload'
import { JSONPatch } from '@writing/utils/patch';
import * as R from 'ramda'

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

const { state: selectionState, pointermoveHandler: selectionTrigger } = useSelection({ el: editorEl })

const { state: blockToolState, pointermoveHandler: blockToolTrigger } = useBlockTool({
  el, mode
})

const { undo, redo, pushLatest } = useHistory(el, model)

const changeHandler = (value: BlockModel, changes: JSONPatch[]) => {
  logger.i('change', value, changes)
  model.value = value
  pushLatest()
}
const addedHandler = ({ block }: { block: BlockModel }) => {
  focusBlock(block.id, 'start')
}
const updatedHandler = ({ oldBlock, block }: { oldBlock: BlockModel, block: BlockModel }) => {
  if (oldBlock.type + oldBlock.id !== block.type + block.id) {
    focusBlock(block.id)
  }
}
const removedHandler = ({ path }: { path: number[] }) => {
  const prev = rootValue.value.getPrev(path)
  if (prev) {
    focusBlock(prev.block.id)
  }
}

onMounted(() => {
  if (props.mode === Mode.Edit) {
    rootValue.value.on('change', changeHandler)

    rootValue.value.on('added', addedHandler)
    rootValue.value.on('updated', updatedHandler)
    rootValue.value.on('removed', removedHandler)
  }
})

onBeforeUnmount(() => {
  rootValue.value.off('change', changeHandler)

  rootValue.value.off('added', addedHandler)
  rootValue.value.off('updated', updatedHandler)
  rootValue.value.off('removed', removedHandler)
})

watch(model, (value) => {
  rootValue.value.updateModel(value)
})

const pointermoveHandler = (event: PointerEvent) => {
  if (props.mode === Mode.Readonly) return
  selectionTrigger(event)
  blockToolTrigger(event)
}

const keydownHandler = (event: KeyboardEvent) => {
  if (props.mode === Mode.Readonly) return
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

  if (!selectionState.value.selection) return
  const { from, to } = selectionState.value.selection
  if (R.equals(from.path, to.path)) return

  event.preventDefault()
  event.stopImmediatePropagation()
  event.stopPropagation()

  const blockPaths: { path: number[], block: BlockModel }[] = []
  rootValue.value.walkTreeBetween(from.path, to.path, (path, block) => {
    blockPaths.push({ path, block })
  })

  const blockIds = blockPaths.map(item => item.block.id)
  const firstBlock = R.head(blockPaths)
  const lastBlock = R.tail(blockPaths)
  const midBlocks = blockIds.filter((_, index) => index > 0 && index < blockIds.length - 1)
  if (midBlocks.length) {
    const leftBlocks: BlockModel[] = []
    blockPaths.forEach(item => {
      BlockTree.walkTree(item.path, rootValue.value.getByPath(item.path), (childPath, block) => {
        const needLeft = !blockIds.includes(block.id)
        if (needLeft && leftBlocks.indexOf(block) === -1) {
          leftBlocks.push(block)
        }
      })
    })

    logger.i('keydownHandler', blockPaths, leftBlocks, blockIds)
    // 把选中的组件删除
    const result = BlockTree.filter(rootValue.value.model, (block) => {
      return !blockIds.includes(block.id)
    })
    rootValue.value.updateModel(result)
    logger.i('keydownHandler', result)
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