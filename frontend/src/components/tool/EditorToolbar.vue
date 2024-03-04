<template>
  <ul class="editor-toolbar" :style="style" v-show="style">
    <li class="toolbar-item"
      :class="{ actived: formats?.bold }"
      @pointerdown.capture="clickHandler('bold')">
      B
    </li>
    <li class="toolbar-item"
      :class="{ actived: formats?.italic }"
      @pointerdown.capture="clickHandler('italic')">
      I
    </li>
    <li class="toolbar-item"
      :class="{ actived: formats?.link }">
      Link
    </li>
    <li class="toolbar-item"
      :class="{ actived: formats?.code }"
      @pointerdown.capture="clickHandler('code')">
      Code
    </li>
  </ul>
</template>

<script lang="ts" setup>
import { computed, inject } from 'vue'
import type { SelectionState } from '@/hooks/selection';
import { createLogger } from '@/utils/logger';
import { getBlockByPath, type BlockModel, walkTreeBetween } from '@/models/block';
import { equals, last, take } from 'ramda'
import { getOps } from '@/models/delta'
import Delta from 'quill-delta';
import useBlockOperate from '../block-operate';

const logger = createLogger('EditorToolbar')

const props = defineProps<{
  root: BlockModel,
  selection: SelectionState
}>()

const blockInstances = inject<Map<string, Omit<ReturnType<typeof useBlockOperate>, 'el'>>>('blockInstances')

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
  walkTreeBetween(
    props.root,
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
    const start = equals(cur.path, selection.from.path) ? selection.from.offset : 0
    const end = equals(cur.path, selection.to.path) ? selection.to.offset : delta.length()
    const ops = getOps(cur.block.data.ops, { index: start, length: end - start})
    const bold = ops.every(op => op.attributes?.bold)
    const italic = ops.every(op => op.attributes?.italic)
    const link = ops.every(op => op.attributes?.link)
    const code = ops.every(op => op.attributes?.code)
    return {
      bold: finalState(acc.bold, bold),
      italic: finalState(acc.italic, italic),
      link: finalState(acc.link, link),
      code: finalState(acc.code, code)
    }
  }, {
    bold: null, italic: null, link: null, code: null
  })
  logger.w('formats', formats)
  return formats
}

const setFormats = (formats: Record<string, any>) => {
  if (!props.selection.selection) return {
    bold: false, italic: false, link: false, code: false
  }
  const { selection } = props.selection
  walkTreeBetween(
    props.root,
    selection.from.path,
    selection.to.path,
    (path, block) => {
      if (block.type === 'text') {
        const delta = new Delta(block.data.ops)
        const start = equals(path, selection.from.path) ? selection.from.offset : 0
        const end = equals(path, selection.to.path) ? selection.to.offset : delta.length()

        const ops = delta.compose(new Delta().retain(start).retain(end - start, formats)).ops

        logger.w('setFormats', [...path], [...ops])
        const index = last(path)!
        const parentPath = take(path.length - 1, path)
        blockInstances?.get(getBlockByPath(props.root, parentPath).id)?.updateBlock(index, {
          data: {
            ...block.data,
            ops
          }
        }, block)

        logger.w('setFormats after', JSON.parse(JSON.stringify(props.root)))
      }
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
  const { from, to } = props.selection.selection!
  const fromBlock = getBlockByPath(props.root, from.path)
  const toBlock = getBlockByPath(props.root, to.path)
  logger.i('clickHandler', fromBlock, toBlock)
  setFormats({
    [format]: !formats.value[format]
  })
}
</script>

<style lang="less" scoped>
.editor-toolbar {
  display: flex;
  color: #fff;
  font-size: 16px;
  background: #000;
  list-style: none;
  padding: 0;
  margin: 0;
  transition: top .1s, left .1s;
  position: absolute;
  // transform: translateX(-50%);
  .toolbar-item {
    height: 36px;
    line-height: 36px;
    padding: 0 8px;
    box-sizing: border-box;
    min-width: 36px;
    text-align: center;
    cursor: pointer;
    transition: background .2s;
    &:hover {
      background: #444;
    }
    &.actived {
      background: #666;
    }
  }
}
</style>