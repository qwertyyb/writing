<template>
  <el-popover trigger="click" width="auto" :visible="visible && emojiVisible" ref="popover" :hide-after="0" transition="none" v-if="visible && emojiVisible">
    <template #reference>
      <div class="emoji-selector-reference"
        :style="{left: position.left + 'px', top: position.top + 'px'}"
      ></div>
    </template>
    <div class="emoji-selector-panel">
      <emoji-panel @change="insertEmoji" :query="props.query" @close="emojiVisible = false"></emoji-panel>
    </div>
  </el-popover>
</template>

<script lang="ts" setup>
import { TextSelection } from 'prosemirror-state';
import type { EditorView } from 'prosemirror-view';
import EmojiPanel from '../../components/EmojiPanel.vue'
import { ElPopover } from 'element-plus';
import { ref, watch } from 'vue';

const props = defineProps<{
  visible: boolean,
  query: string,
  position: { top: number, left: number },
  view: EditorView
}>()

const popover = ref<InstanceType<typeof ElPopover>>()

const emojiVisible = ref(true)

watch(() => props.position, () => {
  popover.value?.popperRef?.popperInstanceRef?.update()
})
watch(() => props.visible, (newVal) => {
  emojiVisible.value = newVal
})

const insertEmoji = (emoji: string) => {
  const { selection } = props.view.state
  const tr = props.view.state.tr
  props.view.dispatch(
    tr
      .replaceRangeWith(selection.to - props.query.length - 1, selection.to, props.view.state.schema.text(emoji, selection.$to.marks()))
      .setSelection(TextSelection.create(tr.doc, selection.to - props.query.length))
  )
}
</script>

<style lang="less" scoped>
.emoji-selector-reference {
  position: absolute;
  width: 1px;
  height: 1px;
}
</style>