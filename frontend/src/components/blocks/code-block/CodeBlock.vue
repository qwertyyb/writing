<template>
  <div class="code-block">
    <div class="code-mirror-container">
      <div class="code-mirror-wrapper" ref="codeMirrorWrapper"></div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { useMode } from "@/hooks/mode";
import type { BlockModel } from "@/models/block";
import { basicSetup, EditorView } from "codemirror";
import { Compartment } from "@codemirror/state"
import { onBeforeUnmount, ref, onMounted, watch } from "vue";
import type { valueEquals } from "element-plus";
import { logger } from "@/utils/logger";

const block = defineModel<BlockModel>({ required: true })

const emits = defineEmits<{
  add: [options?: Partial<BlockOptions>]
}>()

const codeMirrorWrapper = ref<HTMLDivElement>()

const { readonly } = useMode()

let readonlyConfig = new Compartment

watch(readonly, () => {
  viewer?.dispatch({
    effects: readonlyConfig.reconfigure(EditorView.editable.of(!readonly.value))
  })
})

interface CodeData {
  text: string
}
const data = ref<CodeData>({
  text: block.value?.data?.text ?? ''
})

let viewer: EditorView | null = null

const update = (newData: Partial<CodeData>) => {
  data.value = {
    ...data.value,
    ...newData
  }
  block.value = {
    ...block.value,
    data: data.value
  }
}

onMounted(() => {
  viewer = new EditorView({
    doc: data.value.text,
    parent: codeMirrorWrapper.value,  
    extensions: [
      basicSetup,
      EditorView.domEventHandlers({
        // keydown 事件监听不到，此处只能监听 keyup 事件
        keyup: (event: KeyboardEvent) => {
          if (event.key === 'Enter' && data.value.text.endsWith('\n\n')) {
            emits('add')
            viewer.dispatch({changes: {
              from: 0,
              to: data.value.text.length,
              insert: data.value.text.replace(/\n\n$/, '')
            }})
          }
        }
      }),
      EditorView.updateListener.of(event => {
        const newText = event.state.doc.toString()
        if (newText !== data.value.text) {
          update({ text: newText })
        }
      }),
      readonlyConfig.of(EditorView.editable.of(!readonly.value))
    ],
  })
  viewer.contentDOM?.setAttribute('data-focusable', true)
})

onBeforeUnmount(() => {
  viewer?.destroy()
  viewer = null
})

defineExpose({
  save() {
    return data.value
  }
})
</script>

<style lang="less" scoped>
.code-block .code-mirror-wrapper {
  padding: 12px 0;
}
</style>