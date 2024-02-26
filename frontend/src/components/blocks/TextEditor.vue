<template>
  <div class="text-editor">
    <div class="text-editor-content"
      :contenteditable="!readonly"
      :spellcheck="spellcheck"
      data-focusable
      @keydown="keydownHandler($event)"
      @input="inputHandler"
      @paste="pasteHandler"
      v-html="value"
      placeholder="Type something..."
      ref="el"></div>
  </div>
</template>

<script lang="ts" setup>
import { nextTick, ref, watchEffect } from 'vue';
import { getCaretPosition, getCaretOffset, moveCaret } from '@/models/caret';
import { createLogger } from '@/utils/logger';
import { focusAfter, focusBefore } from '@/hooks/focus';

const logger = createLogger('text-editor')

const model = defineModel<string>({ required: true })

defineProps({
  readonly: {
    type: Boolean,
    default: false
  },
  spellcheck: {
    type: Boolean,
    default: false
  }
})

const emits = defineEmits<{
  keyEnter: [offset: number],
  keyEsc: [event: KeyboardEvent],
  keyTab: [event: KeyboardEvent],
  keyShiftTab: [event: KeyboardEvent],

  backspace: [offset: number],

  keydown: [event: KeyboardEvent, offset: number],

  upload: [file: File],

  openTool: [{ x: number, y: number }],

  focusBefore: [offset: number],
  focusAfter: [offset: number],
}>()

const value = ref(model.value ?? '')

const el = ref<HTMLDivElement>()
let triggerRange: Range | undefined | null = null

const getValue = () => el.value?.textContent ?? ''

watchEffect(() => {
  if (getValue() !== (model.value ?? '')) {
    value.value = model.value ?? ''
    if (!el.value) return
    el.value.innerHTML = value.value
  }
})

const TRIGGER_KEY = '/'
enum KeyCodes {
  Enter = 'Enter',
  Backspace = 'Backspace',
  Escape = 'Escape',
  Space = 'Space',
  Tab = 'Tab',

  ArrowUp = 'ArrowUp',
  ArrowDown = 'ArrowDown',
}
const keydownHandler = (event: KeyboardEvent) => {
  if (event.isComposing) return
  const offset = getCaretOffset(el.value!)
  if (event.code === KeyCodes.Enter) {
    event.preventDefault()
    emits('keyEnter', offset)
  } else if (event.code === KeyCodes.Escape) {
    event.preventDefault()
    // 根据当前状态，判断是否要关闭命令选择
    escapeKeyHandler(event)
  } else if (event.code === KeyCodes.Backspace) {
    event.preventDefault()
    backspaceKeyHandler(event)
  } else if (event.key === TRIGGER_KEY) {
    // 打开命令选择
    triggerKeyHandler(event)
  } else if (event.code === KeyCodes.Tab && event.shiftKey) {
    event.preventDefault()
    emits('keyShiftTab', event)
  } else if (event.code === KeyCodes.Tab) {
    event.preventDefault()
    emits('keyTab', event)
  } else {
    const offset = getCaretOffset(el.value!)
    emits('keydown', event, offset)
  }
}

const backspaceKeyHandler = (event: KeyboardEvent) => {
  const target = event.target as HTMLDivElement
  if (!target.contentEditable) return false
  const offset = getCaretOffset(el.value!)
  logger.i('offset', offset)
  if (offset > 0 && offset <= getValue().length) {
    const arr = Array.from(getValue())
    arr.splice(offset - 1, 1)
    model.value = arr.join('')
    nextTick(() => {
      moveCaret(el.value!, offset - 1)
    })
    return
  }
  emits('backspace', offset)
}

const escapeKeyHandler = (event: KeyboardEvent) => {
  event.preventDefault()
  emits('keyEsc', event)
}

const triggerKeyHandler = (event: KeyboardEvent) => {
  // 待输入字符上屏之后再获取位置信息
  setTimeout(() => {
    const { x, y, height } = getCaretPosition() || { x: 0, y: 0, height: 24 }

    const curRange = window.getSelection()?.getRangeAt(0).cloneRange()
    if (curRange?.startOffset ?? 0 > 0) {
      curRange?.setStart(curRange!.startContainer, curRange!.startOffset - 1)
      triggerRange = curRange
    }
    emits('openTool', { x: x, y: y + height })
  })
}

const removeTriggerKey = () => {
  if (triggerRange) {
    triggerRange.deleteContents()
    triggerRange = null
    inputHandler()
  }
}

const inputHandler = () => {
  model.value = getValue()
}

const pasteHandler = (event: ClipboardEvent) => {
  event.preventDefault()
  logger.i('paste', event, event.clipboardData?.files)
  const file = event.clipboardData?.files?.[0]
  if (file) {
    emits('upload', file)
    return
  }
  // 先简单全部作为普通文本来处理
  const plainText = event.clipboardData?.getData('text/plain') ?? ''
  document.execCommand('insertText', false, plainText)
}

defineExpose({
  getValue,
  removeTriggerKey
})
</script>

<style lang="less" scoped>
.text-editor {
  .text-editor-content {
    outline: none;
    min-height: 1.4em;
    line-height: 1.75;
    word-break: break-all;
    &:focus:empty::before,
    &[contenteditable="true"]:hover:empty::before {
      content: attr(placeholder);
      color: rgba(0, 0, 0, .3);
      position: absolute;
    }
  }
}
</style>