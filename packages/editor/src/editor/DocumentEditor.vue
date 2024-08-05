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
import { onBeforeMount, onMounted, ref, watch } from "vue"
import { createPlugins } from './plugins'

const model = defineModel<Pick<Node, 'type' | 'attrs' | 'content' | 'marks'>>()

const emits = defineEmits<{ change: any }>()

const el = ref<HTMLElement>()
let editor: EditorView | null = null


onMounted(() => {
  const view = new EditorView(el.value!, {
    state: EditorState.create({
      schema,
      doc: model.value ? schema.nodeFromJSON(model.value) : undefined,
      plugins: createPlugins(schema)
    }),
    dispatchTransaction(tr) {
      view.updateState(view.state.apply(tr));
      const value = view.state.doc.toJSON()
      console.log('change', value)
      emits('change', value)
    }
  })

  editor = view
})

watch(model, () => {
  if (!editor) return
  editor.updateState(EditorState.create({
    schema: editor.state.schema,
    doc: model.value ? schema.nodeFromJSON(model.value) : undefined,
    plugins: createPlugins(schema)
  }))
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

  --bg-default: transparent;
  --bg-grey: #ebebeb;
  --bg-dark: #dcdfe4;
  --bg-light-grey: #f3f5f7;
  --bg-blue: #c7dcff;
  --bg-light-blue: #e5efff;
  --bg-skyblue: #c7ecff;
  --bg-light-skyblue: #e5f6ff;
  --bg-green: #ace2c5;
  --bg-light-green: #eafaf1;
  --bg-yellow: #ffeead;
  --bg-light-yellow: #fff9e3;
  --bg-orange: #ffdcc4;
  --bg-light-orange: #fff3eb;
  --bg-red: #ffc9c7;
  --bg-light-red: #ffe9e8;
  --bg-rosered: #ffc7e2;
  --bg-light-rosered: #ffecf4;
  --bg-purple: #f2c7ff;
  --bg-light-purple: #fdebff;
  --bg-error: #ffeadb;

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
  p {
    margin: 0;
    padding-block-start: 0.5em;
    padding-block-end: 0.5em;
    line-height: 1.4;
  }
  blockquote {
    margin: 0;
    border-left: 4px solid #ddd;
    padding: 1px 0 1px 16px;
  }
}
</style>