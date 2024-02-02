<template>
  <div class="text-renderer">
    <text-editor :modelValue="data.html"
      :readonly="readonly"
      :spellcheck="spellcheck"
      @update:modelValue="updateModelValue"
      @keyEnter="enterKeyHandler"
      @keyEsc="escapeKeyHandler"
      @emptyKeyBackspace="backspaceKeyHandler"
      @openTool="openToolHandler"
      @focusBefore="$emit('focusBefore')"
      @focusAfter="$emit('focusAfter')"
      ref="textEditorEl"
    ></text-editor>

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
import { ref, reactive, watch, toRaw, watchEffect, nextTick } from 'vue';
import CommandTool from '../commands/CommandTool.vue';
import TextEditor from '@/components/blocks/TextEditor.vue';
import { setCaretToEnd } from '@/models/caret';
import type { BlockModel, BlockOptions } from '@/models/block';
import type { TextData } from './TextBlock';
import { useMode } from '@/hooks/mode';
import { useSpellcheck } from '@/hooks/spellcheck';

const block = defineModel<BlockModel<TextData>>({ required: true })

const props = defineProps<{
  index: number,
  parent?: BlockModel
}>()

const emits = defineEmits<{
  add: [options?: Partial<BlockOptions>],
  update: [options: Partial<BlockOptions>]
  remove: [],
  change: [block: BlockModel],
  focusBefore: [],
  focusAfter: [],
}>()

const { readonly } = useMode()
const { spellcheck } = useSpellcheck()

const data = ref<TextData>({ html: block.value.data?.html ?? '' })
const updateModelValue = (html: string) => {
  data.value.html = html
  block.value = { ...block.value, data: { html } }
}
watchEffect(() => {
  data.value.html = block.value.data?.html ?? ''
})

const textEditorEl = ref<InstanceType<typeof TextEditor>>()

const commandTool = ref<InstanceType<typeof CommandTool>>()
const commandToolVisible = ref(false)
const commandToolPoisition = reactive({ top: 0, left: 0 })
const commandToolKeyword = ref('')

watch(commandToolVisible, () => commandToolKeyword.value = '')

const save = () => {
  return data.value
}

const onCommand = (command: any) => {
  textEditorEl.value?.removeTriggerKey()
  commandToolVisible.value = false
  emits('update', { type: command.identifier, data: toRaw(data.value) })
}

const onExitTool = (options?: { autofocus: boolean }) => {
  commandToolVisible.value = false
  if (options?.autofocus) {
    textEditorEl.value?.$el.focus()
    textEditorEl.value?.$el && setCaretToEnd(textEditorEl.value?.$el)
  }
}

const enterKeyHandler = (event: KeyboardEvent) => {
  event.preventDefault()
  emits('add')
}

const backspaceKeyHandler = (event: KeyboardEvent) => {
  if (props.index! > 0) {
    // 前面没有字符可删除时，删除此block, 把光标移动到上一个block
    event.preventDefault()
    emits('remove')
  }
}

const escapeKeyHandler = (event: KeyboardEvent) => {
  commandToolVisible.value = false
}

const openToolHandler = ({ x = 0, y = 0 }) => {
  // 待输入字符上屏之后再获取位置信息
  commandToolPoisition.top = y
  commandToolPoisition.left = x
  commandToolVisible.value = true
}

defineExpose({
  save
})
</script>

<style lang="less" scoped>
</style>