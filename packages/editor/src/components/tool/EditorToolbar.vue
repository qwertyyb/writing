<template>
  <ul class="editor-toolbar" :style="style" v-show="style"
    @mousedown.prevent>
    <li class="toolbar-item">
      <span class="material-symbols-outlined">text_increase</span>
    </li>
    <li class="toolbar-item">
      <span class="material-symbols-outlined">text_decrease</span>
    </li>
    <li class="toolbar-item"
      :class="{ actived: formats?.bold }"
      @click.capture="clickHandler('bold')">B</li>
    <li class="toolbar-item"
      :class="{ actived: formats?.italic }"
      @pointerdown.capture.stop="clickHandler('italic')">I</li>
    <li class="toolbar-item">
      <span class="material-symbols-outlined" :style="{color: formats.background || ''}">format_color_fill</span>
      <el-color-picker v-model="formats.background"
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
      <el-color-picker v-model="formats.color"
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
      @pointerdown.capture.stop="clickHandler('underline')">
      <span class="material-symbols-outlined">format_underlined</span>
    </li>
    <li class="toolbar-item"
      :class="{ actived: formats?.strike }"
      @pointerdown.capture.stop="clickHandler('strike')">
      <span class="material-symbols-outlined">format_strikethrough</span>
    </li>
    <li class="toolbar-item"
      :class="{ actived: formats?.link }">
      <span class="material-symbols-outlined">add_link</span>
    </li>
    <li class="toolbar-item"
      :class="{ actived: formats?.code }"
      @pointerdown.capture.stop="clickHandler('code')">
      <span class="material-symbols-outlined">code</span>
    </li>
    <li class="toolbar-item"
      :class="{ actived: formats?.super }"
      @pointerdown.capture.stop="clickHandler('super')">
      <span class="material-symbols-outlined">superscript</span>
    </li>
    <li class="toolbar-item"
      :class="{ actived: formats?.sub }"
      @pointerdown.capture.stop="clickHandler('sub')">
      <span class="material-symbols-outlined">subscript</span>
    </li>
  </ul>
</template>

<script lang="ts" setup>
import { computed, inject, toRaw, type ShallowRef, ref } from 'vue'
import type { SelectionState } from '../../hooks/selection';
import { createLogger } from '@writing/utils/logger';
import { type BlockModel } from '../../models/block';
import * as R from 'ramda'
import { getOps } from '../../models/delta'
import Delta from 'quill-delta';
import { BlockTree, rootSymbol } from '../../models/BlockTree';
import { ElColorPicker } from 'element-plus'

const logger = createLogger('EditorToolbar')

const rootValue = inject<ShallowRef<BlockTree>>(rootSymbol)

const TextBlockTypes = ['text', 'heading1', 'heading2', 'heading3', 'heading4', 'heading5', 'heading6']

const props = defineProps<{
  root: BlockModel,
  selection: SelectionState
}>()

const finalState = (origin: boolean | null, value: boolean) => {
  if (origin === null) return value
  return origin && value
}

const getFormats = () => {
  if (!props.selection.selection) return {
    bold: false, italic: false, link: false, code: false
  }
  const { selection } = props.selection
  const textBlocks: { path: number[], block: BlockModel}[] = []
  rootValue?.value.walkTreeBetween(
    selection.from.path,
    selection.to.path,
    (path, block) => {
      if (TextBlockTypes.includes(block.type)) {
        textBlocks.push({ path, block })
      }
    }
  )
  const formats = textBlocks.reduce<Record<string, any>>((acc, cur) => {
    const delta = new Delta(cur.block.data.ops)
    const start = R.equals(cur.path, selection.from.path) ? selection.from.offset : 0
    const end = R.equals(cur.path, selection.to.path) ? selection.to.offset : delta.length()
    const ops = getOps(cur.block.data.ops, { index: start, length: end - start})
    const bold = ops.every(op => op.attributes?.bold)
    const italic = ops.every(op => op.attributes?.italic)
    const link = ops.every(op => op.attributes?.link)
    const code = ops.every(op => op.attributes?.code)
    const scriptSub = ops.every(op => op.attributes?.script === 'sub')
    const scriptSuper = ops.every(op => op.attributes?.script === 'super')
    const strike = ops.every(op => op.attributes?.strike)
    const underline = ops.every(op => op.attributes?.underline)
    if (acc.color === null || typeof acc.color === 'string') {
      const allColors = ops.map(op => {
        if (op.insert) {
          return op.attributes?.color
        }
        return null
      })
      const colors = new Set(allColors)
      if (colors.size === 1) {
        acc.color = acc.color === null ? allColors[0] : acc.color === allColors[0] ? acc.color : false
      } else if (colors.size > 1) {
        acc.color = false
      }
    }
    if (acc.background === null || typeof acc.background === 'string') {
      const allBackgrounds = ops.map(op => {
        if (op.insert) {
          return op.attributes?.background
        }
        return null
      })
      const backgrounds = new Set(allBackgrounds)
      if (backgrounds.size === 1) {
        acc.background = acc.background === null ? allBackgrounds[0] : acc.background === allBackgrounds[0] ? acc.background : false
      } else if (backgrounds.size > 1) {
        acc.background = false
      }
      logger.w('acc.background', acc.background)
    }
    return {
      ...acc,
      bold: finalState(acc.bold, bold),
      italic: finalState(acc.italic, italic),
      link: finalState(acc.link, link),
      code: finalState(acc.code, code),
      sub: finalState(acc.sub, scriptSub),
      super: finalState(acc.super, scriptSuper),
      strike: finalState(acc.strike, strike),
      underline: finalState(acc.underline, underline)
    }
  }, {
    bold: null, italic: null, link: null, code: null, sub: null, super: null, strike: null, underline: null,
    background: null, color: null
  })
  logger.i('formats', formats.background, formats.color)
  return formats
}

const setFormats = (formats: Record<string, any>) => {
  if (!props.selection.selection) return {
    bold: false, italic: false, link: false, code: false
  }
  const { selection } = props.selection
  rootValue?.value.walkTreeBetween(
    selection.from.path,
    selection.to.path,
    (path, block) => {
      if (!TextBlockTypes.includes(block.type)) return
      const delta = new Delta(block.data.ops)
      const start = R.equals(path, selection.from.path) ? selection.from.offset : 0
      const end = R.equals(path, selection.to.path) ? selection.to.offset : delta.length()

      const ops = delta.compose(new Delta().retain(start).retain(end - start, formats)).ops

      rootValue?.value.update(path, {
        data: {
          ...block.data,
          ops
        }
      })
    }
  )
}

const formats = computed(() => {
  if (!props.selection.selection) return {};
  return getFormats()
})

const style = computed(() => {
  if (!props.selection.rect) return null
  logger.i('style', props.selection.rect.left + props.selection.rect.width / 2)
  return {
    top: (props.selection.rect.top - 42) + 'px',
    left: (props.selection.rect.left) + 'px'
  }
})

const clickHandler = (format: string) => {
  logger.i('clickHandler', format, toRaw(props.selection))
  let name = format
  let value: string | boolean = !formats.value[name]
  if (format === 'super') {
    name = 'script'
    value = formats.value[name] ? false : 'super'
  } else if (format === 'sub') {
    name = 'script'
    value = formats.value[name] ? false : 'sub'
  }
  setFormats({
    [name]: value
  })
}

const formatText = (name: string, value: boolean | string) => {
  setFormats({
    [name]: value
  })
}

</script>

<style lang="less" scoped>
.editor-toolbar {
  display: flex;
  color: #444;
  font-size: 16px;
  background: #eee;
  border: 1px solid #bbb;
  box-shadow: 4px 7px 7px #ccc;
  list-style: none;
  padding: 0;
  margin: 0;
  transition: top .1s, left .1s;
  position: absolute;
  // transform: translateX(-50%);
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
      color: blue;
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
</style>