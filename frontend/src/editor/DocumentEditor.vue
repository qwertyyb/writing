<template>
  <div class="document-editor">
    <input type="text" placeholder="请输入标题" value="页面标题" class="document-editor-title" />
    <div class="document-editor-content" ref="el"></div>
  </div>
</template>

<script lang="ts" setup>
import {EditorState} from "prosemirror-state"
import { EditorView } from "prosemirror-view"
import {Node} from "prosemirror-model"
import {schema} from "./schema"
import { onBeforeMount, onMounted, ref } from "vue"
import { createLogger } from "@/utils/logger"
import { createPlugins } from './plugins'

const logger = createLogger('DocumentEditor')

const model = defineModel<Pick<Node, 'type' | 'attrs' | 'content' | 'marks'>>()

const emits = defineEmits<{ change: any }>()

const el = ref<HTMLElement>()
let editor: EditorView | null = null


onMounted(() => {
  const view = new EditorView(el.value!, {
    state: EditorState.create({
      doc: model.value ? schema.nodeFromJSON(model.value) : undefined,
      plugins: createPlugins(schema)
    }),
    dispatchTransaction(tr) {
      view.updateState(view.state.apply(tr));
      const value = view.state.doc.toJSON()
      logger.i('change', value, view.state.selection.toJSON())
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
  display: flex;
  flex-direction: column;
  & > * {
    width: 100%;
  }
  .document-editor-title {
    font-size: 36px;
    border: none;
  }
  .document-editor-content {
    min-height: 60vh;
  }
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
      max-height: 200px;
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