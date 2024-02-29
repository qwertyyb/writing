<template>
  <div class="document-editor" ref="el">
  </div>
</template>

<script lang="ts" setup>
import {EditorState} from "prosemirror-state"
import {EditorView} from "prosemirror-view"
import {Node} from "prosemirror-model"
import {schema} from "./schema"
import { onBeforeMount, onMounted, ref } from "vue"
import { createLogger } from "@/utils/logger"
import { createPlugins } from './plugins'

const logger = createLogger('DocumentEditor')

const model = defineModel<Pick<Node, 'type' | 'attrs' | 'content' | 'marks'>>()

const emits = defineEmits<{ change: any }>()

const el = ref<HTMLElement>()
let editor = ref<EditorView>()

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

  editor.value = view
})

onBeforeMount(() => {
  editor.value?.destroy()
})

</script>

<style lang="less" scoped>
.document-editor:deep(*) {
  outline: none;
  border: none;
}
</style>