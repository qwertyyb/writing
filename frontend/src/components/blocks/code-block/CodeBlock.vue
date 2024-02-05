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

const block = defineModel<BlockModel>({ required: true })

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
      EditorView.updateListener.of(event => {
        const newText = event.state.doc.toString()
        if (newText !== data.value.text) {
          update({ text: newText })
        }
      }),
      readonlyConfig.of(EditorView.editable.of(!readonly.value))
    ],
  })
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