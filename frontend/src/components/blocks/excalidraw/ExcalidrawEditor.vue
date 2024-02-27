<template>
  <div class="excalidraw-editor" ref="el">
  </div>
</template>

<script lang="ts" setup>
import { useMode } from '@/hooks/mode';
import { onBeforeUnmount, onMounted, ref } from 'vue';
import { excalidraw } from './excalidraw';

const model = defineModel<{
  elements: any[],
  appState: any,
  files: any
}>()

const { readonly } = useMode()

const el = ref<HTMLDivElement>()

let reactRoot: any = null

const changeHandler = (elements: any[], appState: any, files: any[]) => {
  model.value = {
    elements, appState, files
  }
}
onMounted(() => {
  setTimeout(() => {
    const App = () => {
      return window.React.createElement(
        window.React.Fragment,
        null,
        window.React.createElement(
          window.ExcalidrawLib.Excalidraw,
          {
            initialData: {
              ...model.value,
              scrollToContent: true,
            },
            onChange: changeHandler,
            langCode: 'zh-CN',
            viewModeEnabled: readonly.value,
          }
        ),
      );
    };

    reactRoot = window.ReactDOM.createRoot(el.value!);
    reactRoot.render(window.React.createElement(App));
  }, 100)
})

onBeforeUnmount(() => {
  resizeObserver.disconnect()
  reactRoot?.unmount()
})

defineExpose({
  exportToBlob() {
    return window.ExcalidrawLib.exportToBlob({
      elements: model.value?.elements,
      appState: model.value?.appState,
      files: model.value,
    })
  }
})

</script>

<style lang="less" scoped>
.excalidraw-editor {
  height: 100%;
}
</style>