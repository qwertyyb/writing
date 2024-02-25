<template>
  <div class="text-renderer">
    <text-editor :modelValue="data.html"
      :readonly="readonly"
      :spellcheck="spellcheck"
      @update:modelValue="updateModelValue"
      @keyEnter="enterKeyHandler"
      @keyEsc="escapeKeyHandler"
      @keyTab="tabKeyHandler"
      @keyShiftTab="shiftTabKeyHandler"
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
import { getBlockByPath } from '@/hooks/move';
import { createLogger } from '@/utils/logger';
import { upload } from '@/services/upload';
import { getImageRatio } from './image/utils';

const logger = createLogger('text-block')

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
  merge: [mergePath: number[]],

  change: [block: BlockModel],
  focusBefore: [],
  focusAfter: [],
}>()

const { readonly } = useMode()
const spellcheck = useSpellcheck()

const data = ref<TextData>({ html: block.value.data?.html ?? '' })
const updateModelValue = (html: string) => {
  data.value.html = html
  block.value = { ...block.value, data: { html } }
}
watchEffect(() => {
  data.value.html = block.value.data?.html ?? ''
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
  if (!data.value.html.length) {
    // 没有输入字符时，回车，往上级移动
    const handled = moveUpper()
    if (handled) return
  }
  // 把当前内容截断
  const after = data.value.html.substring(offset)
  updateModelValue(data.value.html.substring(0, offset))
  logger.i('add text node', after)
  emits('add', {
    type: 'text',
    data: {
      html: after
    }
  })
}

const root = inject<ModelRef<BlockModel>>('root')

const moveUpper = () => {
  if (!props.path || props.path.length <= 2) return false
  const newPath = [...props.path.slice(0, props.path.length - 1)]
  logger.i('newPath', newPath)
  emits('move', newPath)
  return true
}

const tabKeyHandler = () => {
  if (props.index <= 0 || !root?.value || !props.path || props.path.length < 2) return
  const newParentPath = [...props.path.slice(0, props.path.length - 1), props.index - 1]
  const parentBlock = getBlockByPath(root.value, newParentPath)
  const newPath = [...newParentPath, parentBlock.children?.length ?? 0]
  emits('move', newPath)
}

const shiftTabKeyHandler = () => {
  moveUpper()
}

const getPrevMergablePath = () => {
  if (!props.path || !root?.value) return null

  const getMergablePathLast = (root: BlockModel, path: number[]): number[] | null => {
    const block = getBlockByPath(root, path)

    for(let i = (block.children?.length ?? 0) - 1; i >= 0; i -= 1) {
      const mergablePath = getMergablePathLast(root, [...path, i])
      if (mergablePath) return mergablePath
    }

    if (block.type === 'text') {
      return path
    }
    return null
  }

  let prevPath = [...props.path]
  while(prevPath.length) {
    let prevPathIndex = prevPath.pop()! - 1
    while(prevPathIndex >= 0) {
      const prevBlock = getBlockByPath(root.value, [...prevPath, prevPathIndex])
      if (!prevBlock) break

      const mergablePath = getMergablePathLast(root.value, [...prevPath, prevPathIndex])
      if (mergablePath) {
        return mergablePath
      }

      prevPathIndex -= 1
    }
  }
  return null
}

const backspaceKeyHandler = (offset: number) => {
  if (data.value.html && offset === 0) {
    if (!moveUpper()) {
      // 无法向上级移动了，需要和上一个合并？
      const prevPath = getPrevMergablePath()
      if (prevPath) {
        logger.i('merge', prevPath)
        emits('merge', prevPath)
      }
    }
    return
  } else if (!data.value.html) {
    // 前面没有字符可删除时，删除此block, 把光标移动到上一个block
    emits('remove')
  }
}

const escapeKeyHandler = (event: KeyboardEvent) => {
  commandToolVisible.value = false
}

const keydownHandler = (event: KeyboardEvent, offset: number) => {
  if (event.key !== ' ') return
  const trigger = data.value.html?.substring(0, offset)
  const content = data.value.html?.substring(offset)
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