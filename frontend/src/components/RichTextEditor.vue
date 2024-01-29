<template>
  <div class="rich-text-editor" ref="editorEl">
    <div class="block-list">
      <div class="block-item" v-for="(block, index) in model.children" :key="block.id">
        <div class="block-tool">
          <span class="material-symbols-outlined block-tool-icon">
          drag_indicator
          </span>
        </div>
        <div class="block-content"
          :data-block-id="block.id"
          contenteditable
          @click="commandToolVisible = false"
          @keydown="keydownHandler($event, block, index, model.children)">
          <command-renderer :block="block"></command-renderer>
        </div>
      </div>
    </div>
    <command-tool v-if="commandToolVisible"
      ref="commandTool"
      :keyword="commandToolKeyword"
      :style="{top: commandToolPoisition.top + 'px', left: commandToolPoisition.left + 'px'}"
    ></command-tool>
  </div>
</template>

<script lang="ts" setup>
import { nextTick, ref, reactive, watch } from 'vue';
import CommandTool from './CommandTool.vue';
import CommandRenderer from './commands/CommandRenderer.vue';
import { getCaretPosition, setCaretToEnd } from '@/models/caret';
import { createBlock, Block } from '@/models/block';

const editorEl = ref<HTMLDivElement>()

const commandTool = ref<InstanceType<typeof CommandTool>>()
const commandToolVisible = ref(false)
const commandToolPoisition = reactive({ top: 0, left: 0 })
const commandToolKeyword = ref('')

watch(commandToolVisible, () => commandToolKeyword.value = '')

const model = defineModel({
  default: createBlock({
    id: 'test',
    type: 'doc',
    children: [
      createBlock({
        id: 'text',
        type: 'text',
        content: {
          text: '这是测试内容1'
        }
      })
    ]
  })
})

const focusBlock = (id: string) => {
  nextTick(() => {
    const input: HTMLDivElement | null | undefined = editorEl?.value?.querySelector(`[data-block-id=${JSON.stringify(id)}]`)
    input?.focus()
    input && setCaretToEnd(input)
  })
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
const keydownHandler = (event: KeyboardEvent, current: Block, index: number, blocks: Block[]) => {
  if (event.isComposing) return
  if (event.code === KeyCodes.Enter) {
    enterKeyHandler(event, current, index, blocks)
  } else if (event.code === KeyCodes.Escape) {
    // 根据当前状态，判断是否要关闭命令选择
    escapeKeyHandler(event, current, index, blocks)
  } else if (event.code === KeyCodes.Backspace) {
    backspaceKeyHandler(event, current, index, blocks)
  } else if (event.key === TRIGGER_KEY) {
    // 打开命令选择
    triggerKeyHandler(event, current, index, blocks)
  } else if (commandToolVisible.value && /^(\w|\d)$/.test(event.key)) {
    commandToolKeyword.value += event.key
  } else if (commandToolVisible.value && event.key === KeyCodes.ArrowUp) {
    commandTool.value?.selectPrev()
  } else if (commandToolVisible.value && event.key === KeyCodes.ArrowDown) {
    commandTool.value?.selectNext()
  } else if (commandToolVisible.value && event.code === KeyCodes.Space) {
    const command = commandTool.value?.confirm()
    if (!command) return
    const newBlock = model.value.insert({
      type: command.value,
      id: Math.random().toString(16).substring(2),
      content: {
        text: ''
      }
    }, index)
    model.value.remove(current.id)
    focusBlock(newBlock.id)
    commandToolVisible.value = false
    console.log(current.id, newBlock.id, index)
  }
}

const enterKeyHandler = (event: KeyboardEvent, current: Block, index: number, blocks: Block[]) => {
  event.preventDefault();
  // add new block
  const block = model.value.push({
    type: 'text',
    id: Math.random().toString(16).substring(2),
    content: {
      text: ''
    }
  }, index)
  focusBlock(block.id)
}

const backspaceKeyHandler = (event: KeyboardEvent, current: Block, index: number, blocks: Block[]) => {
  const target = event.target as HTMLDivElement
  if (!target.contentEditable) return false
  const text = target.textContent
  if (text?.length === 0 && index > 0) {
    // 前面没有字符可删除时，删除此block, 把光标移动到上一个block
    event.preventDefault()
    model.value.remove(current.id)
    focusBlock(blocks[index - 1].id)
  } else if (commandToolVisible.value) {
    if (commandToolKeyword.value) {
      commandToolKeyword.value = commandToolKeyword.value.substring(0, commandToolKeyword.value.length - 1)
    } else {
      // 要删除的字符是触发命令的字符，则关闭命令弹窗
      const selectedRange = window.getSelection()?.getRangeAt(0);
      if (!selectedRange) return
      
      const range = document.createRange()
      range.setStart(selectedRange.startContainer, selectedRange.startOffset - 1)
      range.setEnd(selectedRange.endContainer, selectedRange.endOffset)
      if (range.toString() === TRIGGER_KEY) {
        // 前一字符已触发命令，则关闭命令
        commandToolVisible.value = false
      }
    }
  }
}

const escapeKeyHandler = (event: KeyboardEvent, current: Block, index: number, blocks: Block[]) => {
  commandToolVisible.value = false
}

const triggerKeyHandler = (event: KeyboardEvent, current: Block, index: number, blocks: Block[]) => {
  // 待输入字符上屏之后再获取位置信息
  setTimeout(() => {
    const { x, y, height } = getCaretPosition() || { x: 0, y: 0, height: 24 }
    const { x: px, y: py } = editorEl.value?.getBoundingClientRect() || { x: 0, y: 0 };

    commandToolPoisition.top = y - py + height
    commandToolPoisition.left = x - px
    commandToolVisible.value = true
  })
}

</script>

<style scoped>
.rich-text-editor {
  min-width: 50vw;
  min-height: 50vh;
  position: relative;
}
.rich-text-editor .block-list .block-item {
  display: flex;
  align-items: top;
  justify-content: flex-start;
}
.rich-text-editor .block-item .block-tool {
  width: 24px;
  height: 24px;
  cursor: pointer;
  opacity: 0;
}
.rich-text-editor .block-item .block-tool .block-tool-icon {
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
.rich-text-editor .block-item:hover .block-tool {
  opacity: 1;
}
.rich-text-editor .block-item:focus-within .block-tool {
  opacity: 1;
}
.rich-text-editor .block-item .block-content {
  flex: 1;
  outline: none;
}
</style>