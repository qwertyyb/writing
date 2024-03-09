<template>
  <div class="editor-toolbar" ref="el" :style="floatingStyles"
    :data-popper-placement="placement"
    v-show="selection.rect">
    <ul class="editor-toolbar-item-list"
      @mousedown.prevent>
      <li class="toolbar-item" @click.capture="setSizeFormat('decrease')">
        <span class="material-symbols-outlined">text_decrease</span>
      </li>
      <li class="toolbar-item">{{ formats?.size || '16px' }}</li>
      <li class="toolbar-item" @click.capture="setSizeFormat('increase')">
        <span class="material-symbols-outlined">text_increase</span>
      </li>
      <li class="toolbar-item"
        :class="{ actived: formats?.bold }"
        @click.capture="toggleFormat('bold')">
        <span class="material-symbols-outlined">format_bold</span>
      </li>
      <li class="toolbar-item"
        :class="{ actived: formats?.italic }"
        @pointerdown.capture.stop="toggleFormat('italic')">
        <span class="material-symbols-outlined">format_italic</span>
      </li>
      <li class="toolbar-item">
        <span class="material-symbols-outlined" :style="{color: formats.background || ''}">format_color_fill</span>
        <el-color-picker :model-value="formats.background || ''"
          show-alpha
          @change="formatText('background', $event)"
          class="editor-color-picker"
          :predefine="[
          '#ff4500',
          '#ff8c00',
          '#ffd700',
          '#90ee90',
          '#00ced1',
          '#1e90ff',
          '#c71585',
          'rgba(255, 69, 0, 0.68)',
          'rgb(255, 120, 0)',
          'hsv(51, 100, 98)',
          'hsva(120, 40, 94, 0.5)',
          'hsl(181, 100%, 37%)',
          'hsla(209, 100%, 56%, 0.73)',
          '#c7158577',
        ]" />
      </li>
      <li class="toolbar-item">
        <el-color-picker :model-value="formats.color || ''"
          show-alpha
          class="editor-color-picker"
          @change="formatText('color', $event)"
          :predefine="[
          '#ff4500',
          '#ff8c00',
          '#ffd700',
          '#90ee90',
          '#00ced1',
          '#1e90ff',
          '#c71585',
          'rgba(255, 69, 0, 0.68)',
          'rgb(255, 120, 0)',
          'hsv(51, 100, 98)',
          'hsva(120, 40, 94, 0.5)',
          'hsl(181, 100%, 37%)',
          'hsla(209, 100%, 56%, 0.73)',
          '#c7158577',
        ]" />
        <span class="material-symbols-outlined" :style="{color: formats.color || ''}">format_color_text</span>
      </li>
      <li class="toolbar-item"
        :class="{ actived: formats?.underline }"
        @pointerdown.capture.stop="toggleFormat('underline')">
        <span class="material-symbols-outlined">format_underlined</span>
      </li>
      <li class="toolbar-item"
        :class="{ actived: formats?.strike }"
        @pointerdown.capture.stop="toggleFormat('strike')">
        <span class="material-symbols-outlined">format_strikethrough</span>
      </li>
      <li class="toolbar-item"
        :class="{ actived: formats?.link }"
        @click="onLinkTap">
        <el-popover trigger="click" :width="340" :visible="selection.rect && linkPopoverVisible">
          <template #reference>
            <span class="material-symbols-outlined">add_link</span>
          </template>
          <div class="link-input-wrapper">
            <el-input size="small"
              class="link-input"
              v-model="link"
              placeholder="请输入链接"></el-input>
            <el-button type="danger" size="small" @click="onLinkClearBtnTap">清除</el-button>
            <el-button type="primary" size="small" @click="onLinkSaveBtnTap">保存</el-button>
          </div>
        </el-popover>
      </li>
      <li class="toolbar-item"
        :class="{ actived: formats?.code }"
        @pointerdown.capture.stop="toggleFormat('code')">
        <span class="material-symbols-outlined">code</span>
      </li>
      <li class="toolbar-item"
        :class="{ actived: formats?.script === 'super' }"
        @pointerdown.capture.stop="formatText('script', 'super')">
        <span class="material-symbols-outlined">superscript</span>
      </li>
      <li class="toolbar-item"
        :class="{ actived: formats?.script === 'sub' }"
        @pointerdown.capture.stop="formatText('script', 'sub')">
        <span class="material-symbols-outlined">subscript</span>
      </li>
    </ul>
    <div
      ref="floatingArrow"
      class="floating-arrow"
      :style="{
        position: 'absolute',
        left:
          middlewareData.arrow?.x != null
            ? `${middlewareData.arrow.x}px`
            : '',
        top:
          middlewareData.arrow?.y != null
            ? `${middlewareData.arrow.y}px`
            : '',
      }"
    ></div>
  </div>
</template>

<script lang="ts" setup>
import { computed, inject, toRaw, type ShallowRef, ref, onMounted, onBeforeUnmount, watch, toRef } from 'vue'
import { SelectionRange, type SelectionState } from '../../hooks/selection';
import { ElColorPicker } from 'element-plus'
import { VirtualElement, useFloating, flip, shift, arrow, offset } from '@floating-ui/vue'
import { useFormat } from '../../hooks/operator';

const props = defineProps<{
  selection: SelectionState
}>()
const el = ref<HTMLElement>()
const floatingArrow = ref<HTMLElement>()
const linkPopoverVisible = ref(false)

const {
  formats, link, selection,
  formatText, toggleFormat, setSizeFormat, setLinkFormat,
  saveSelection
} = useFormat(props.selection)

const onLinkTap = () => {
  link.value = formats.value.link || ''
  saveSelection()
  linkPopoverVisible.value = true
}

const onLinkSaveBtnTap = () => {
  setLinkFormat()
  linkPopoverVisible.value = false
}
const onLinkClearBtnTap = () => {
  link.value = ''
  setLinkFormat()
  linkPopoverVisible.value = false
}



const getRect = () => ({
  getBoundingClientRect: () => {
    if (!selection.value.rect) return {
      x: 0, y: 0, top: 0, left: 0, width: 0, height: 0, right: 0, bottom: 0
    }
    const { top, left, width, height  } = selection.value.rect
    return {
      x: left,
      y: top,
      top: top,
      left: left,
      width: width,
      height: height,
      right: left + width,
      bottom: top + height
    }
  }
})

const reference = ref<VirtualElement>(getRect())

watch(() => selection.value.rect, () => {
  reference.value = getRect()
})

const { floatingStyles, middlewareData, placement } = useFloating(reference, el, {
  placement: 'bottom',
  middleware: [offset(10), flip({ mainAxis: true, crossAxis: false, }), shift(), arrow({ element: floatingArrow })]
})

</script>

<style lang="less" scoped>
.editor-toolbar {
  filter: drop-shadow(4px 7px 7px #ccc);
  z-index: 10;

  &[data-popper-placement="top"] .floating-arrow {
    width: 0; 
    height: 0; 
    border-left: 10px solid transparent;
    border-right: 10px solid transparent;
    
    border-top: 10px solid #eee;
  }

  &[data-popper-placement="bottom"] .floating-arrow {
    width: 0; 
    height: 0; 
    border-left: 10px solid transparent;
    border-right: 10px solid transparent;
    
    border-bottom: 10px solid #eee;
    top: -10px;
  }
}
.editor-toolbar-item-list {
  display: flex;
  color: #444;
  font-size: 16px;
  background: #eee;
  list-style: none;
  padding: 0;
  margin: 0;
  transition: top .1s, left .1s;
  .toolbar-item {
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0 8px;
    box-sizing: border-box;
    min-width: 36px;
    text-align: center;
    cursor: pointer;
    transition: background .2s;
    position: relative;
    &:hover {
      background: #dedede;
    }
    &.actived {
      background: #aaa;
    }
    &:deep(.material-symbols-outlined) {
      font-size: 20px;
    }
    &:deep(.el-color-picker) {
      inset: 0;
      position: absolute;
      opacity: 0;
    }
  }
}
.link-input-wrapper {
  display: flex;
  .link-input {
    margin-right: 12px;
  }
}
</style>