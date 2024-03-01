<template>
  <div class="document-editor" ref="el">
  </div>
</template>

<script lang="ts" setup>
import {EditorState} from "prosemirror-state"
import {Decoration, EditorView, type DecorationSource} from "prosemirror-view"
import {Node} from "prosemirror-model"
import {schema} from "./schema"
import { onBeforeMount, onMounted, ref } from "vue"
import { createLogger } from "@/utils/logger"
import { createPlugins } from './plugins'
import { createImageNode } from "./nodes/ImageNode"

const logger = createLogger('DocumentEditor')

const model = defineModel<Pick<Node, 'type' | 'attrs' | 'content' | 'marks'>>()

const emits = defineEmits<{ change: any }>()

const el = ref<HTMLElement>()
let editor: EditorView | null = null

const createImage = (node: Node, view: EditorView, getPos: () => number | undefined, decorations: readonly Decoration[], innerDecorations: DecorationSource) => {
  const imageNode = createImageNode(node)
  return {
    dom: imageNode,
    contentDOM: imageNode.querySelector('img'),
    update(node: Node) {
      imageNode.querySelector('img')!.style.width = node.attrs.size + '%'
      // view.dispatch(view.state.tr.setSelection(view))
      return false
    }
  }
}


onMounted(() => {
  const view = new EditorView(el.value!, {
    state: EditorState.create({
      doc: model.value ? schema.nodeFromJSON(model.value) : undefined,
      plugins: createPlugins(schema)
    }),
    dispatchTransaction(tr) {
      view.updateState(view.state.apply(tr));
      const value = view.state.doc.toJSON()
      logger.i('change', value)
      emits('change', value)
    }
  })

  editor = view

  // @ts-ignore
  window.view = view
})

onBeforeMount(() => {
  editor?.destroy()
})

</script>

<style lang="less" scoped>
.document-editor {
  position: relative;
}
.document-editor:deep(*) {
  outline: none;
  &.toolbar {
    position: absolute;
    display: none;
    transform: translateX(-50%);
  }
  .toolbar-group {
    background-color: #000;
    color: #fff;
    border-radius: 4px;
    height: 30px;
    display: flex;
    align-items: center;
    margin: 0;
    padding: 0;
    .toolbar-item {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100%;
      padding: 0 12px;
      cursor: pointer;
      background: none;
      border-radius: 0;
      color: inherit;
      border: none;
      transition: background-color .3s;
      &:hover {
        background-color: #333;
      }
      &.is-active {
        background-color: #666;
      }
    }
  }
  
  &.block-tool {
    position: absolute;
    box-shadow: 0 3px 15px -3px rgba(13,20,33,.13);
    border: 1px solid #e8e8eb;
    border-radius: 6px;
    overflow: hidden;
    background: #fff;
    .block-search-input {
      flex: 1;
      border: none;
      outline: none;
      border-radius: 6px;
      font-size: 14px;
      background: rgb(247, 245, 245);
      height: 20px;
      padding: 4px 12px;
    }
    .block-tool-list {
      display: flex;
      flex-direction: column;
      width: 200px;
      height: 200px;
      overflow: auto;
    }
    .block-tool-item {
      height: 36px;
      line-height: 36px;
      padding: 0 12px;
      &.hidden {
        display: none;
      }
      &.selected {
        background: #ddd;
      }
    }
  }
  
  .image-node {
    position: relative;
    display: flex;
    img.image {
      transition: width .3s;
    }
    &.align-Left img.image {
      margin-right: auto
    }
    &.align-Right img.image {
      margin-left: auto;
    }
    &.align-Center img.image {
      margin-left: auto;
      margin-right: auto;
    }
  }
  blockquote {
    margin: 0;
    border-left: 4px solid #ddd;
    padding: 1px 0 1px 16px;
  }
}
</style>