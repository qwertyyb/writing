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
import Quill from './quill';
import { DeltaOperation } from 'quill';

const logger = createLogger('TextEditor');

const model = defineModel<string | DeltaOperation[]>({ required: true });

const props = defineProps({
  readonly: {
    type: Boolean,
    default: false
  },
  spellcheck: {
    type: Boolean,
    default: false
  },
  trigger: {
    type: String,
    default: 'Slash'
  }
});

const emits = defineEmits<{
  keyEnter: [offset: number],
  keyEsc: [event: KeyboardEvent],
  keyTab: [event: KeyboardEvent],
  keyShiftTab: [event: KeyboardEvent],

  backspace: [offset: number],

  keydown: [event: KeyboardEvent, offset: number],

  upload: [file: File],

  keyTrigger: [{ top: number, left: number, width: number, height: number }, offset: number],
  change: [editor: Quill]
}>();

const el = ref<HTMLDivElement>();

let editor: Quill | null;

const setValue = () => {
  let values: DeltaOperation[] = model.value as DeltaOperation[];
  if (typeof model.value === 'string') {
    values = [{ insert: model.value }];
  }
  editor?.setContents(values as any);
};

watch(model, () => {
  if (!editor) return;
  if (JSON.stringify(model.value) !== JSON.stringify(editor.getContents().ops)) {
    setValue();
  }
});

onMounted(() => {
  editor = new Quill(el.value!, {
    modules: {
      toolbar: false,
      clipboard: true,
      markdown: true
    },
    readOnly: props.readonly,
    formats: ['background', 'bold', 'color', 'font', 'code', 'italic', 'link', 'size', 'strike', 'script', 'underline', 'formula'],
    placeholder: 'Type someting'
  });
  setValue();
  editor.on('text-change', (delta, origin) => {
    logger.i('text-change', delta, origin);
    const { ops } = editor!.getContents();
    model.value = markRaw(ops as DeltaOperation[]);
    emits('change', editor);
  });
  el.value!.querySelector<HTMLElement>('.ql-editor')!.dataset.focusable = 'true';
});

onBeforeUnmount(() => {
  editor = null;
});

watch(() => props.readonly, () => {
  editor.enable(!props.readonly);
});

const keydownHandler = (event: KeyboardEvent) => {
  if (event.isComposing) return;
  const range = editor.getSelection(true);
  if (!range) return;
  const { index: offset, length } = range;
  if (length) return;

  const modifiers = {
    Meta: event.metaKey,
    Shift: event.shiftKey,
    Alt: event.altKey,
    Ctrl: event.ctrlKey
  };
  const key = [Object.keys(modifiers).filter(modifier => modifiers[modifier]).join('+'), event.code].filter(i => i).join('+');

  logger.i('keydownHandler', key);

  const prevent = (fn: () => void) => {
    return () => {
      event.preventDefault();
      event.stopImmediatePropagation();
      event.stopPropagation();
      fn();
      return true;
    };
  };

  const keyMap = {
    Enter: prevent(() => emits('keyEnter', offset)),
    Escape: prevent(() => escapeKeyHandler(event)),
    Backspace: () => backspaceKeyHandler(event, offset),
    [props.trigger]: () => triggerKeyHandler(),
    Tab: prevent(() => emits('keyTab', event)),
    'Shift+Tab': prevent(() => emits('keyShiftTab', event)),
  };

  if (keyMap[key]) {
    keyMap[key]();
  } else {
    emits('keydown', event, offset);
  }
};

const backspaceKeyHandler = (event: KeyboardEvent, offset: number) => {
  if (offset > 0) {
    return;
  }
  event.preventDefault();
  emits('backspace', offset);
};

const escapeKeyHandler = (event: KeyboardEvent) => {
  event.preventDefault();
  emits('keyEsc', event);
};

const triggerKeyHandler = () => {
  // 待输入字符上屏之后再获取位置信息
  setTimeout(() => {
    const { index } = editor!.getSelection(true);
    const { top, left, height, width } = editor!.getBounds(index) || { x: 0, y: 0, height: 24 };
    const pRect = el.value.getBoundingClientRect();
    emits('keyTrigger',
      { top: top + pRect.top, left: left + pRect.left, width, height },
      index
    );
  });
};

const pasteHandler = (event: ClipboardEvent) => {
  event.preventDefault();
  logger.i('paste', event, event.clipboardData?.files);
  const file = event.clipboardData?.files?.[0];
  if (file) {
    emits('upload', file);
    return;
  }
  // 先简单全部作为普通文本来处理
  const range = editor.getSelection(true);
  if (!range) return;
  const { index } = range;
  const plainText = event.clipboardData?.getData('text/plain') ?? '';
  editor.insertText(index, plainText);
  setTimeout(() => {
    logger.i('selection', index + plainText.length);
    editor.setSelection(index + plainText.length, 0);
  }, 10);
};
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