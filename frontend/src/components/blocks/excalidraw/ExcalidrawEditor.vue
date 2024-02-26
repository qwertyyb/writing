<template>
  <div class="excalidraw-editor" ref="el">
  </div>
</template>

<script lang="ts" setup>
import { useMode } from '@/hooks/mode';
import { onBeforeUnmount, onMounted, ref } from 'vue';

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
  const App = () => {
    return window.React.createElement(
      window.React.Fragment,
      null,
      window.React.createElement(
        window.ExcalidrawLib.Excalidraw,
        {
          initialData: model.value,
          onChange: changeHandler,
          langCode: 'zh-CN',
          viewModeEnabled: readonly.value,
        }
      ),
    );
  };

  reactRoot = window.ReactDOM.createRoot(el.value!);
  reactRoot.render(window.React.createElement(App));
})

onBeforeUnmount(() => {
  reactRoot.unmount()
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
  height: calc(100vh - 120px);
}
</style>