<template>
  <div class="text-editor">
    <div class="text-editor-content"
      :contenteditable="!readonly"
      :spellcheck="spellcheck"
      data-focusable
      @keydown="keydownHandler($event)"
      @input="inputHandler"
      v-html="value"
      placeholder="Type something..."
      ref="el"></div>
  </div>
</template>

<script lang="ts" setup>
import { ref, watchEffect } from 'vue';
import { getCaretPosition, isInHeading, isInTailing } from '@/models/caret';
import { focusBefore, focusAfter } from '@/hooks/focus'

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
  keyEnter: [event: KeyboardEvent],
  keyEsc: [event: KeyboardEvent],

  emptyKeyBackspace: [event: KeyboardEvent],

  openTool: [{ x: number, y: number }],

  focusBefore: [],
  focusAfter: [],
}>()

const value = ref(model.value ?? '')

const editorEl = ref<HTMLDivElement>()
const el = ref<HTMLDivElement>()
let triggerRange: Range | undefined | null = null

const getValue = () => el.value?.innerHTML ?? ''

watchEffect(() => {
  if (getValue() !== (model.value ?? '')) {
    value.value = model.value ?? ''
  }
})

const TRIGGER_KEY = '/'
enum KeyCodes {
  Enter = 'Enter',
  Backspace = 'Backspace',
  Escape = 'Escape',
  Space = 'Space',

  ArrowUp = 'ArrowUp',
  ArrowDown = 'ArrowDown',
  ArrowLeft = 'ArrowLeft',
  ArrowRight = 'ArrowRight',
}
const keydownHandler = (event: KeyboardEvent) => {
  if (event.isComposing) return
  if (event.code === KeyCodes.Enter) {
    enterKeyHandler(event)
  } else if (event.code === KeyCodes.Escape) {
    // 根据当前状态，判断是否要关闭命令选择
    escapeKeyHandler(event)
  } else if (event.code === KeyCodes.Backspace) {
    backspaceKeyHandler(event)
  } else if (event.key === TRIGGER_KEY) {
    // 打开命令选择
    triggerKeyHandler(event)
  } else if (event.code === KeyCodes.ArrowUp) {
    if (isInHeading(el.value!)) {
      // emits('focusBefore')
      focusBefore()
    }
  } else if (event.code === KeyCodes.ArrowDown) {
    if (isInTailing(el.value!)) {
      console.log('focusAfter')
      focusAfter()
    }
  }
}

const enterKeyHandler = (event: KeyboardEvent) => {
  emits('keyEnter', event);
}

const backspaceKeyHandler = (event: KeyboardEvent) => {
  const target = event.target as HTMLDivElement
  if (!target.contentEditable) return false
  const text = target.textContent
  if (text?.length === 0) {
    // 前面没有字符可删除时，删除此block, 把光标移动到上一个block
    event.preventDefault()
    emits('emptyKeyBackspace', event)
  }
}

const escapeKeyHandler = (event: KeyboardEvent) => {
  event.preventDefault()
  emits('keyEsc', event)
}

const triggerKeyHandler = (event: KeyboardEvent) => {
  // 待输入字符上屏之后再获取位置信息
  setTimeout(() => {
    const { x, y, height } = getCaretPosition() || { x: 0, y: 0, height: 24 }
    const { x: px, y: py } = editorEl.value?.getBoundingClientRect() || { x: 0, y: 0 };

    const curRange = window.getSelection()?.getRangeAt(0).cloneRange()
    if (curRange?.startOffset ?? 0 > 0) {
      curRange?.setStart(curRange!.startContainer, curRange!.startOffset - 1)
      triggerRange = curRange
    }

    emits('openTool', { x: x - px, y: y - py + height })
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
    &:focus:empty::before {
      content: attr(placeholder);
      color: rgba(0, 0, 0, .3);
      position: absolute;
    }
  }
}
</style>