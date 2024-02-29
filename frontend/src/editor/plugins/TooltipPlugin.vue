<template>
  <ul class="editor-plugin-tooltip">
    <li class="tooltip-item bold-cmd" :class="{ actived: isBold }">B</li>
    <li class="tooltip-item italic-cmd" :class="{ actived: isItalic }">I</li>
    <li class="tooltip-item link-cmd" :class="{ actived: isLink }">Link</li>
    <li class="tooltip-item code-cmd" :class="{ actived: isCode }">Code</li>
  </ul>
</template>

<script lang="ts" setup>
import type { EditorView } from 'prosemirror-view';
import { onMounted, ref, type ShallowRef } from 'vue';

const props = defineProps<{ editor: ShallowRef<EditorView> }>()


const isBold = ref(false)
const isItalic = ref(false)
const isLink = ref(false)
const isCode = ref(false)

onMounted(() => {
  const editor = props.editor.value
  if (!editor.state) return;
  const { from, to } = editor.state.selection

  isBold.value = editor.state.doc.rangeHasMark(from, to, editor.state.schema.marks.strong)
  isItalic.value = editor.state.doc.rangeHasMark(from, to, editor.state.schema.marks.em)
  isLink.value = editor.state.doc.rangeHasMark(from, to, editor.state.schema.marks.link)
  isCode.value = editor.state.doc.rangeHasMark(from, to, editor.state.schema.marks.icode)
})

</script>

<style lang="less" scoped>
.editor-plugin-tooltip {
  position: absolute;
  background-color: #000;
  color: #fff;
  border-radius: 4px;
  height: 30px;
  display: flex;
  align-items: center;
  margin: 0;
  padding: 0;
  .tooltip-item {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    padding: 0 12px;
    cursor: pointer;
    transition: background-color .3s;
    &:hover {
      background-color: #333;
    }
    &.actived {
      background-color: #666;
    }
  }
}
</style>