<template>
  <div class="text-renderer">
    <div class="text-editor"
      contenteditable
      @click="commandToolVisible = false"
      @keydown="keydownHandler($event)"
      v-html="block?.data?.html ?? ''"
      placeholder="Type something..."
      ref="el"></div>

    <command-tool v-if="commandToolVisible"
      ref="commandTool"
      @confirm="onCommand"
      @exit="onExitTool"
      :keyword="commandToolKeyword"
      :style="{top: commandToolPoisition.top + 'px', left: commandToolPoisition.left + 'px'}"
    ></command-tool>
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive, watch } from 'vue';
import CommandTool from './CommandTool.vue';
import { getCaretPosition, setCaretToEnd } from '@/models/caret';
import type { BlockModel, BlockOptions } from '@/models/block';

const editorEl = ref<HTMLDivElement>()

const commandTool = ref<InstanceType<typeof CommandTool>>()
const commandToolVisible = ref(false)
const commandToolPoisition = reactive({ top: 0, left: 0 })
const commandToolKeyword = ref('')

watch(commandToolVisible, () => commandToolKeyword.value = '')

const props = defineProps<{
  block: BlockModel,
  index: number,
  parent?: BlockModel
}>()

const emits = defineEmits<{
  add: [options?: Partial<BlockOptions>],
  update: [options: Partial<BlockOptions>]
  remove: [],
}>()

const onCommand = (command: any) => {
  commandToolVisible.value = false
  emits('update', { type: command.identifier })
}

const onExitTool = (options?: { autofocus: boolean }) => {
  commandToolVisible.value = false
  if (options?.autofocus) {
    el.value?.focus()
    setCaretToEnd(el.value!)
  }
}

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
  }
}

const enterKeyHandler = (event: KeyboardEvent) => {
  event.preventDefault();
  emits('add')
}

const backspaceKeyHandler = (event: KeyboardEvent) => {
  const target = event.target as HTMLDivElement
  if (!target.contentEditable) return false
  const text = target.textContent
  if (text?.length === 0 && props.index! > 0) {
    // 前面没有字符可删除时，删除此block, 把光标移动到上一个block
    event.preventDefault()
    emits('remove')
  }
}

const escapeKeyHandler = (event: KeyboardEvent) => {
  commandToolVisible.value = false
}

const triggerKeyHandler = (event: KeyboardEvent) => {
  // 待输入字符上屏之后再获取位置信息
  setTimeout(() => {
    const { x, y, height } = getCaretPosition() || { x: 0, y: 0, height: 24 }
    const { x: px, y: py } = editorEl.value?.getBoundingClientRect() || { x: 0, y: 0 };

    commandToolPoisition.top = y - py + height
    commandToolPoisition.left = x - px
    commandToolVisible.value = true
  })
}

const el = ref<HTMLDivElement>()

defineExpose({
  save() {
    return {
      html: el.value?.innerHTML ?? ''
    }
  }
})
</script>

<style lang="less" scoped>
.text-renderer {
  [contenteditable] {
    outline: none;
    &:focus:empty::before {
      content: attr(placeholder);
      color: rgba(0, 0, 0, .3);
    }
  }
}
</style>