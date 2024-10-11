<template>
  <div class="document-editor">
    <div class="document-editor-content" ref="el"></div>
  </div>
</template>

<script lang="ts" setup>
import {EditorState} from "prosemirror-state"
import { EditorView } from "prosemirror-view"
import { markdownParser, markdownSerializer } from './markdown/'
import {schema} from "./schema"
import { onBeforeMount, onMounted, ref } from "vue"
import { createPlugins } from './plugins'
import { isEqual } from "lodash-es"
import { type NodeValue } from "./types"
import { uploadSymbol } from "./const"
import { createLogger } from '@writing/utils/logger'

const model = defineModel<NodeValue>()

const props = defineProps<{
  upload?: (file: File, options?: { previous?: string }) => Promise<string>,
  editable?: boolean,
}>()

const el = ref<HTMLElement>()
let editor: EditorView | null = null

const logger = createLogger('Editor')

onMounted(() => {
  const view = new EditorView(el.value!, {
    state: EditorState.create({
      schema,
      doc: model.value ? schema.nodeFromJSON(model.value) : undefined,
      plugins: createPlugins(schema, {
        [uploadSymbol]: props.upload,
        editable: props.editable,
      })
    }),
    attributes: { spellcheck: 'false' },
    editable: () => props.editable,
    dispatchTransaction(tr) {
      view.updateState(view.state.apply(tr));
      const value = view.state.doc.toJSON()
      logger.d('selection', view.state.selection.from)
      if (isEqual(value, model.value)) return
      logger.d('change', value)
      view.dom.dispatchEvent(new CustomEvent('datachange', { detail: { view } }))
      model.value = value
    }
  })

  editor = view
})

onBeforeMount(() => {
  editor?.destroy()
})

defineExpose({
  export(fileType: 'markdown') {
    if (!editor) return null
    if (fileType === 'markdown') {
      return markdownSerializer.serialize(editor.state.doc)
    }
  },
  import(content: string, fileType: 'markdown', ) {
    if (!editor) return
    logger.d(`import ${fileType}: `, content)
    const result = markdownParser.parse(content)
    logger.d('import result: ', result)
    // 插入到当前光标下方
    const pos = editor.state.selection.$to.after(1)
    const tr = editor.state.tr
    tr.replaceWith(pos, pos, result.content)
    editor.dispatch(tr)
  }
})

</script>

<style lang="less" scoped>
.document-editor {
  position: relative;
  display: flex;
  flex-direction: column;
  padding: 0 var(--tool-size);

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

  --tool-size: 20px;

  & > * {
    width: 100%;
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
  code {
    font-size: 14px;
    word-wrap: break-word;
    padding: 2px 4px;
    border-radius: 4px;
    margin: 0 2px;
    color: #1e6bb8;
    background-color: rgba(27, 31, 35, .05);
    font-family: Operator Mono, Consolas, Monaco, Menlo, monospace;
    word-break: break-all;
  }
  blockquote {
    margin: 0;
    border-left: 4px solid #ddd;
    padding: 1px 0 1px 16px;
  }
  // ul, ol {
  //   list-style-position: inside;
  //   & > li > *:first-child{
  //     display: inline;
  //   }
  // }
  .ProseMirror {
    padding-bottom: 40vh;
  }
}
</style>