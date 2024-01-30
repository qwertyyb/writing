<template>
  <div class="rich-text-editor" ref="editorEl">
    <div class="editor-js" ref="editorEl"></div>
  </div>
</template>

<script lang="ts" setup>
import Editor from '@editorjs/editorjs'
import { onBeforeUnmount, onMounted, ref } from 'vue';

let editorEl = ref<HTMLDivElement>()
let editor: Editor | null = null;

onMounted(() => {
  editor = new Editor({
    holder: editorEl.value
  })
})

onBeforeUnmount(() => {
  editor?.destroy()
  editor = null
})

</script>

<style scoped>
.rich-text-editor {
  min-width: 50vw;
  min-height: 50vh;
  position: relative;
}
</style>