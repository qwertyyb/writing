<template>
  <div class="block-tool"
    v-if="position.top || position.left"
    :style="{top: position.top + 'px', left: position.left + 'px'}"
  >
    <!-- <el-popover width="auto" :popper-style="{padding: 0}">
      <template #reference>
        <div class="block-tool-item material-symbols-outlined">add</div>
      </template>
      <ul class="menu-list">
      </ul>
    </el-popover> -->
    <el-popover trigger="click" width="auto"
      :popper-style="{padding: 0}"
      @show="$emit('panelShow')"
      @hide="$emit('panelHide')"
      v-model:visible="popoverVisible"
    >
      <template #reference>
        <div class="block-tool-item material-symbols-outlined"
          draggable="true"
          @dragstart="dragstartHandler"
          @dragend="$emit('dragEnd')"
        >drag_indicator</div>
      </template>
      <ul class="menu-list">
        <li class="menu-item" @click="action('addBefore')">
          <span class="menu-item-icon material-symbols-outlined">arrow_outward</span>
          <span class="menu-item-label">在前面添加</span>
        </li>
        <li class="menu-item" @click="action('addAfter')">
          <span class="menu-item-icon material-symbols-outlined">south_east</span>
          <span class="menu-item-label">在后面添加</span>
        </li>
        <li class="menu-item">
          <span class="menu-item-icon material-symbols-outlined">format_align_left</span>
          <span class="menu-item-label">对齐</span>
        </li>
        <li class="menu-item">
          <span class="menu-item-icon material-symbols-outlined">format_color_fill</span>
          <span class="menu-item-label">背景颜色</span>
        </li>
        <li class="menu-item">
          <span class="menu-item-icon material-symbols-outlined">format_color_text</span>
          <span class="menu-item-label">字体颜色</span>
        </li>
        <li class="menu-item divider"></li>
        <li class="menu-item" @click="action('remove')">
          <span class="menu-item-icon material-symbols-outlined">delete</span>
          <span class="menu-item-label">删除</span>
        </li>
      </ul>
    </el-popover>
  </div>
</template>

<script lang="ts" setup>
import { createLogger } from '@writing/utils/logger';
import { ElMessage, ElPopover } from 'element-plus';
import { NodeSelection, TextSelection } from 'prosemirror-state';
import type { EditorView } from 'prosemirror-view';
// @ts-ignore
import { __serializeForClipboard as serializeForClipboard } from 'prosemirror-view'
import { ref } from 'vue';

const logger = createLogger('block-tool')

const props = defineProps<{
  position: { top: number, left: number },
  visible: boolean,
  pos: number,
  view: EditorView,
}>()

const emits = defineEmits<{
  dragStart: [],
  dragEnd: [],
  panelShow: [],
  panelHide: [],
}>()

const popoverVisible = ref(false)

const dragstartHandler = (event: DragEvent) => {
  if (!event.dataTransfer) return

  emits('dragStart')
  props.view.dispatch(
    props.view.state.tr.setSelection(NodeSelection.create(props.view.state.doc, props.pos))
  )

  let slice = props.view.state.selection.content()
  let { dom, text } = serializeForClipboard(props.view, slice)

  event.dataTransfer.clearData()
  event.dataTransfer.setData('text/html', dom.innerHTML)
  event.dataTransfer.setData('text/plain', text)
  const nodeDOM = props.view.nodeDOM(props.pos)
  if (nodeDOM) {
    event.dataTransfer.setDragImage(nodeDOM as HTMLElement, 0, 0)
  }
  // eslint-disable-next-line vue/no-mutating-props
  props.view.dragging = { slice, move: true }
}

const action = (name: string) => {
  if (name === 'remove') {
    const $pos = props.view.state.doc.resolve(props.pos + 1)
    props.view.dispatch(props.view.state.tr.deleteRange($pos.before(), $pos.after()))
    popoverVisible.value = false
  } else if (name === 'addBefore' || name === 'addAfter') {
    const $pos = props.view.state.doc.resolve(props.pos)
    const index = name === 'addBefore' ? $pos.index() : $pos.index() + 1
    const targetPos = name === 'addBefore' ? props.pos : props.pos + $pos.nodeAfter!.nodeSize
    const selectionPos = name === 'addBefore' ? props.pos : props.pos + $pos.nodeAfter!.nodeSize
    const newNode = $pos.parent.contentMatchAt(index).defaultType?.createAndFill()
    logger.d(newNode?.type, $pos.parent)
    if (!newNode) {
      return ElMessage.error('无法新增')
    }
    logger.d('insert at', targetPos)
    const tr = props.view.state.tr
      .insert(targetPos, newNode)
    tr.setSelection(TextSelection.create(tr.doc, selectionPos))
    tr.scrollIntoView()
    props.view.dispatch(tr)
    popoverVisible.value = false
    props.view.focus()
  }
}

</script>

<style lang="less">
.plugin-block-tool:has(*:hover) + .ProseMirror {
  .hover {
    transition: background .2s;
    background: rgba(72, 118, 125, 0.3);
    border-radius: 4px;
  }
}
</style>

<style lang="less" scoped>
.block-tool {
  position: absolute;
  transform: translate(-100%, -50%);
  display: flex;
  padding: 3px;
  margin: 0;
  margin-left: -0.5em;
  &::after {
    content: " ";
    display: block;
    position: absolute;
    top: 0;
    right: -2em;
    width: 2em;
    height: 100%;
  }
  .block-tool-item {
    transition: background .1s;
    cursor: pointer;
    color: rgba(0, 0, 0, 0.6);
    font-size: 20px;
    background: #fff;
    filter: drop-shadow(0 0 10px rgb(169, 169, 169));
    &:hover {
      background: rgb(240, 240, 240);
    }
  }
}

.menu-list {
  display: flex;
  margin: 0;
  padding: 0;
  flex-direction: column;
  list-style: none;
  .menu-item {
    width: 200px;
    height: 32px;
    line-height: 32px;
    cursor: pointer;
    padding: 0 8px;
    box-sizing: border-box;
    display: flex;
    align-items: center;
    &:hover {
      background: rgba(0, 0, 0, 0.1);
    }
    &.divider {
      height: 1px;
      padding: 0;
      background: rgba(0, 0, 0, .1);
    }
    .menu-item-icon {
      font-size: 20px;
      margin-right: 8px;
    }
    .menu-item-label {
      flex: 1;
    }
  }
}
</style>