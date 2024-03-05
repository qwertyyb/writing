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
      <span class="material-symbols-outlined">format_color_fill</span>
    </li>
    <li class="toolbar-item">
      <span class="material-symbols-outlined">format_color_text</span>
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
import { computed, inject, type ShallowRef } from 'vue'
import type { SelectionState } from '@/hooks/selection';
import { createLogger } from '@/utils/logger';
import { type BlockModel } from '@/models/block';
import * as R from 'ramda'
import { getOps } from '@/models/delta'
import Delta from 'quill-delta';
import { BlockTree, rootSymbol } from '@/models/BlockTree';

const logger = createLogger('EditorToolbar')

const rootValue = inject<ShallowRef<BlockTree>>(rootSymbol)

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
      if (block.type === 'text') {
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
    return {
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
  })
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
      if (block.type !== 'text') return
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
  logger.i('clickHandler', JSON.parse(JSON.stringify(props.selection)))
  logger.i('clickHandler', format)
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
    &:hover {
      background: #dedede;
    }
    &.actived {
      color: blue;
    }
    &:deep(.material-symbols-outlined) {
      font-size: 20px;
    }
  }
}
</style>