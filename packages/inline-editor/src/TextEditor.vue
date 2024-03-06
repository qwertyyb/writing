<template>
  <div class="text-editor">
    <div class="text-editor-content"
      tabindex="0"
      :spellcheck="spellcheck"
      @keydown.capture="keydownHandler($event)"
      @paste="pasteHandler"
      placeholder="Type something..."
      ref="el"></div>
  </div>
</template>

<script lang="ts" setup>
import { markRaw, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { createLogger } from '@writing/utils/logger';
import Quill from './quill'
import { DeltaOperation } from 'quill';

const logger = createLogger('TextEditor')

const model = defineModel<string | DeltaOperation[]>({ required: true })

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
}>()

const el = ref<HTMLDivElement>()

let editor: Quill | null

const setValue = () => {
  let values: DeltaOperation[] = model.value as DeltaOperation[]
  if (typeof model.value === 'string') {
    values = [{ insert: model.value }]
  }
  editor?.setContents(values as any)
}

watch(model, () => {
  if (!editor) return
  if (JSON.stringify(model.value) !== JSON.stringify(editor.getContents().ops)) {
    setValue()
  }
})

onMounted(() => {
  editor = new Quill(el.value!, {
    modules: {
      toolbar: false,
      clipboard: true,
      markdown: true
    },
    formats: ['background', 'bold', 'color', 'font', 'code', 'italic', 'link', 'size', 'strike', 'script', 'underline'],
    placeholder: 'Type someting'
  })
  setValue()
  editor.on('text-change', (delta, origin, source) => {
    logger.i('text-change', delta, origin)
    const { ops } = editor!.getContents()
    model.value = markRaw(ops as DeltaOperation[])
  })
  el.value!.querySelector<HTMLElement>('.ql-editor')!.dataset.focusable = 'true'
})

onBeforeUnmount(() => {
  editor = null
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
  const { index: offset } = editor!.getSelection(true)
  if (event.code === KeyCodes.Enter) {
    event.preventDefault()
    event.stopImmediatePropagation()
    event.stopPropagation()
    emits('keyEnter', offset)
  } else if (event.code === KeyCodes.Escape) {
    event.preventDefault()
    event.stopImmediatePropagation()
    event.stopPropagation()
    // 根据当前状态，判断是否要关闭命令选择
    escapeKeyHandler(event)
  } else if (event.code === KeyCodes.Backspace) {
    backspaceKeyHandler(event, offset)
  } else if (event.key === TRIGGER_KEY) {
    // 打开命令选择
    triggerKeyHandler(event)
  } else if (event.code === KeyCodes.Tab && event.shiftKey) {
    event.preventDefault()
    event.stopImmediatePropagation()
    event.stopPropagation()
    emits('keyShiftTab', event)
  } else if (event.code === KeyCodes.Tab) {
    event.preventDefault()
    event.stopImmediatePropagation()
    event.stopPropagation()
    emits('keyTab', event)
  } else {
    emits('keydown', event, offset)
  }
}

const backspaceKeyHandler = (event: KeyboardEvent, offset: number) => {
  const target = event.target as HTMLDivElement
  if (!target.contentEditable) {
    event.preventDefault()
    return false
  }
  if (offset > 0) {
    return
  }
  event.preventDefault()
  emits('backspace', offset)
}

const escapeKeyHandler = (event: KeyboardEvent) => {
  event.preventDefault()
  emits('keyEsc', event)
}

const triggerKeyHandler = (event: KeyboardEvent) => {
  // 待输入字符上屏之后再获取位置信息
  setTimeout(() => {
    const { index } = editor!.getSelection(true)
    const { top, left, height } = editor!.getBounds(index) || { x: 0, y: 0, height: 24 }
    const pRect = el.value!.getBoundingClientRect()
    emits('openTool', { x: left + pRect.left, y: top + pRect.top + height })
  })
}

const removeTriggerKey = () => {
  const { index } = editor!.getSelection(true)
  editor!.deleteText(index, 1)
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

:deep(.ql-editor) {
  outline: none;
  p {
    margin: 0;
    padding: 0;
  }
  code {
    padding: 0.2em 0.4em;
    margin: 0 0.2em;
    font-size: 85%;
    white-space: break-spaces;
    background-color: var(--document-editor-inline-bg-color, rgba(175,184,193,0.2));
    border-radius: 6px;
    font-family: ui-monospace,SFMono-Regular,SF Mono,Menlo,Consolas,Liberation Mono,monospace;
  }
}
:deep(.ql-clipboard) {
  width: 0;
  height: 0;
  overflow: hidden;
}
</style>