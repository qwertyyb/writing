<template>
  <div class="document-editor" ref="el">
    <h3>你好，ProseMirror</h3>
    <p>这就是可编辑的文本，你可以将光标放入然后开始打字。</p>
    <p>若要应用样式，你可以先选中一段文字，然后从菜单中进行相关操作。基本的 schema 支持 <em>斜体</em>，<strong>加粗</strong>，<a href="https://xheldon.com">链接</a>， <code>代码字体</code>， 以及 <img src="https://via.placeholder.com/200" alt="alt" /> 图片。</p>
    <p>块级的结构可以使用按键绑定来快捷操作（试试 ctrl+shift+2 以创建一个二级标题，或者在一个空的文本 block 中按回车， 以退出父级 block），或者通过 menu。</p>
    <p>试试选中一段文本后使用菜单中的 `list` 选项来将其用有序列表包裹的效果。</p>
  </div>
</template>

<script lang="ts" setup>
import {EditorState} from "prosemirror-state"
import {EditorView} from "prosemirror-view"
import {DOMParser, Node} from "prosemirror-model"
import {schema} from "./schema"
import { onBeforeMount, onMounted, ref } from "vue"

const model = defineModel<Node>()

const emits = defineEmits<{ change: any }>()

const el = ref<HTMLElement>()
let editor = ref<EditorView>()

onMounted(() => {
  const view = new EditorView(el.value!, {
    state: EditorState.create({
      doc: DOMParser.fromSchema(schema).parse(el.value!),
    }),
    dispatchTransaction(tr) {
      view.updateState(view.state.apply(tr));
      emits('change', view.state.doc.toJSON())
    }
  })

  editor.value = view
})

onBeforeMount(() => {
  editor.value?.destroy()
})

</script>