<template>
  <div class="text-block">
    <text-editor :modelValue="data.ops"
      data-block-prop="data,html"
      :readonly="readonly"
      :spellcheck="spellcheck"
      @update:modelValue="updateModelValue"
      @keyEnter="enterKeyHandler"
      @keyEsc="escapeKeyHandler"
      @keyTab="$emit('moveLower')"
      @keyShiftTab="$emit('moveUpper')"
      @backspace="backspaceKeyHandler"
      @openTool="openToolHandler"
      @upload="uploadHandler"
      @keydown="keydownHandler"
      ref="textEditorEl"
    ></text-editor>

    <teleport to="body">
      <block-tool v-if="commandToolVisible"
        ref="commandTool"
        @confirm="onCommand"
        @exit="onExitTool"
        :keyword="commandToolKeyword"
        :style="{top: commandToolPoisition.top + 'px', left: commandToolPoisition.left + 'px'}"
      ></block-tool>
    </teleport>
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive, watch, toRaw, inject } from 'vue';
import BlockTool from '../tool/BlockTool.vue';
import TextEditor from '@writing/inline-editor';
import { moveCaretToEnd } from '../../models/caret';
import { createBlock, type BlockModel, type BlockOptions } from '../../models/block';
import { useMode } from '../../hooks/mode';
import { useSpellcheck } from '../../hooks/spellcheck';
import { transformBlock } from '../../hooks/transform';
import { createLogger } from '@writing/utils/logger';
import { getImageRatio } from './image/utils';
import { type DeltaOperation } from 'quill'
import { isEmpty, split, toText } from '@writing/utils/delta';
import type { TextData } from '../schema';
import { uploadSymbol } from '../../utils/upload';

const logger = createLogger('TextBlock')

const block = defineModel<BlockModel<TextData>>({ required: true })

const props = defineProps<{
  path?: number[],
}>()

const emits = defineEmits<{
  add: [options?: Partial<BlockOptions>],
  update: [options: Partial<BlockOptions>]
  remove: [],
  move: [newPath: number[]],
  moveUpper: [],
  moveLower: [],
  merge: [],
}>()

const { readonly } = useMode()
const spellcheck = useSpellcheck()
const uploader = inject<(file: Blob | File) => Promise<string>>(uploadSymbol)

const data = ref<TextData>({ ...block.value.data, ops: block.value.data?.ops ?? [] })

const updateModelValue = (ops: DeltaOperation[]) => {
  block.value = { ...block.value, data: { ops } }
  data.value = { ops }
}
watch(block, () => {
  if (JSON.stringify(data.value.ops) !== JSON.stringify(block.value?.data?.ops)) {
    data.value.ops = block.value.data?.ops ?? []
  }
})

const textEditorEl = ref<InstanceType<typeof TextEditor>>()

const commandTool = ref<InstanceType<typeof BlockTool>>()
const commandToolVisible = ref(false)
const commandToolPoisition = reactive({ top: 0, left: 0 })
const commandToolKeyword = ref('')

watch(commandToolVisible, () => commandToolKeyword.value = '')

const onCommand = (command: any) => {
  textEditorEl.value?.removeTriggerKey()
  commandToolVisible.value = false
  logger.i('onCommand', JSON.parse(JSON.stringify({ ...block.value, type: command.identifier, data: toRaw(data.value) })))
  block.value = { ...block.value, type: command.identifier, data: toRaw(data.value) }
}

const onExitTool = (options?: { autofocus: boolean }) => {
  commandToolVisible.value = false
  if (options?.autofocus) {
    textEditorEl.value?.$el.focus()
    textEditorEl.value?.$el && moveCaretToEnd(textEditorEl.value?.$el.querySelector('[contenteditable]'))
  }
}

const enterKeyHandler = async (offset: number) => {
  if (isEmpty(data.value.ops)) {
    // 没有输入字符时，回车，往上级移动
    const handled = moveUpper()
    if (handled) return
  }
  // 把当前内容截断
  const { before, after } = split(data.value.ops, offset)
  updateModelValue(before as any)
  logger.i('add text node', after)
  emits('add', {
    type: 'text',
    data: {
      ops: after
    }
  })
}

const moveUpper = () => {
  if (!props.path || props.path.length <= 1) return false
  emits('moveUpper')
  return true
}

const backspaceKeyHandler = (offset: number) => {
  if (!isEmpty(data.value.ops) && offset === 0) {
    if (!moveUpper()) {
      // 无法向上级移动了，需要和上一个合并？
      emits('merge')
    }
    return
  } else if (isEmpty(data.value.ops)) {
    // 前面没有字符可删除时，删除此block, 把光标移动到上一个block
    emits('remove')
  }
}

const escapeKeyHandler = () => {
  commandToolVisible.value = false
}

const keydownHandler = (event: KeyboardEvent, offset: number) => {
  if (event.code !== 'Space') return
  const { before, after: content } = split(data.value.ops, offset)
  const trigger = toText(before)
  logger.i('keydownHandler', trigger, content)
  const newBlock = transformBlock(trigger, block.value, content)
  if (newBlock) {
    event.preventDefault()
    block.value = newBlock as any
  }
}

const openToolHandler = ({ x = 0, y = 0 }) => {
  // 待输入字符上屏之后再获取位置信息
  commandToolPoisition.top = y
  commandToolPoisition.left = x
  commandToolVisible.value = true
}

const uploadHandler = async (file: File) => {
  const isImage = file.type.startsWith('image/')
  if (!isImage) {
    return logger.i('暂不支持的文件类型', file)
  }
  const url = await uploader(file)
  const data = await getImageRatio(url)
  emits('add', createBlock({
    type: 'image',
    data
  }))
}
</script>

<style lang="less" scoped>
</style>