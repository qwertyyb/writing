<template>
  <div class="text-renderer">
    <text-editor :modelValue="data.ops || data.html"
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
      @focusBefore="$emit('focusBefore')"
      @focusAfter="$emit('focusAfter')"
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
import { ref, reactive, watch, toRaw, watchEffect, inject, type ModelRef, nextTick } from 'vue';
import BlockTool from '../tool/BlockTool.vue';
import TextEditor from '@/components/blocks/TextEditor.vue';
import { moveCaretToEnd } from '@/models/caret';
import { createBlock, type BlockModel, type BlockOptions } from '@/models/block';
import type { TextData } from './TextBlock';
import { useMode } from '@/hooks/mode';
import { useSpellcheck } from '@/hooks/spellcheck';
import { transformBlock } from '@/hooks/transform';
import { createLogger } from '@/utils/logger';
import { upload } from '@/services/upload';
import { getImageRatio } from './image/utils';
import { type DeltaOperation } from 'quill'
import { isEmpty, split, toText } from '@/models/delta';

const logger = createLogger('TextBlock')

const block = defineModel<BlockModel<TextData | any>>({ required: true })

const props = defineProps<{
  index: number,
  path?: number[],
  parent?: BlockModel
}>()

const emits = defineEmits<{
  emptyEnterKey: [event: KeyboardEvent]

  add: [options?: Partial<BlockOptions>],
  update: [options: Partial<BlockOptions>]
  remove: [],
  move: [newPath: number[]],
  moveUpper: [],
  moveLower: [],
  merge: [],

  change: [block: BlockModel],
  focusBefore: [],
  focusAfter: [],
}>()

const { readonly } = useMode()
const spellcheck = useSpellcheck()

const data = ref<TextData>({ ...block.value.data, ops: block.value.data?.ops ?? [] })

const updateModelValue = (ops: DeltaOperation[]) => {
  logger.i('updateModelValue after', ops)
  block.value = { ...block.value, data: { ops } }
  data.value = { ops }

  logger.i('updateModelValue after', data.value)
}
watch(block, () => {
  if (JSON.stringify(data.value.ops) !== JSON.stringify(block.value?.data?.ops)) {
    data.value.ops = block.value.data?.ops ?? ''
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
  // await nextTick()
  logger.i('add text node', after)
  emits('add', {
    type: 'text',
    data: {
      ops: after
    }
  })
}

const root = inject<ModelRef<BlockModel>>('root')

const moveUpper = () => {
  if (!props.path || props.path.length <= 2) return false
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
    block.value = newBlock
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
  const { data: { url } } = await upload(file)
  const data = await getImageRatio(url)
  emits('add', createBlock({
    type: 'image',
    data
  }))
}
</script>

<style lang="less" scoped>
</style>