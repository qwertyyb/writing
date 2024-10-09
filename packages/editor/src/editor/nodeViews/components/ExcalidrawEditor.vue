<template>
  <div class="excalidraw-editor">
    <div class="excalidraw-view-wrapper"
      ref="el"
    ></div>
  </div>
</template>

<script setup lang="ts">
import type { RestoredDataState } from '@excalidraw/excalidraw/types/data/restore';
import type { ExcalidrawElement } from '@excalidraw/excalidraw/types/element/types';
import type { AppState, BinaryFiles } from '@excalidraw/excalidraw/types/types';
import { debounce, isEqual } from 'lodash-es';
import { onBeforeUnmount, onMounted, ref, toRaw } from 'vue';

const props = defineProps<{ initialData: any }>()
const emits = defineEmits<{
  change: [RestoredDataState]
}>()

const el = ref<HTMLDivElement>()

let lastValue: any

const changeHandler = debounce(async (elements: ExcalidrawElement[], appState: AppState, files: BinaryFiles) => {
  const data = JSON.parse(window.ExcalidrawLib.serializeAsJSON(elements, appState, files, 'local'))
  if (isEqual(data, lastValue)) {
    return
  }
  lastValue = data
  emits('change', data)
}, 500)

let reactRoot: any = null
const renderExcalidraw = () => {
  lastValue = toRaw(props.initialData)
  const App = () => {
    return window.React.createElement(
      window.React.Fragment,
      null,
      window.React.createElement(
        window.ExcalidrawLib.Excalidraw,
        {
          initialData: {
            ...props.initialData,
            scrollToContent: true,
          },
          onChange: changeHandler,
          langCode: 'zh-CN',
        }
      ),
    );
  };

  reactRoot = window.ReactDOM.createRoot(el.value!);
  reactRoot.render(window.React.createElement(App));
}

onMounted(() => {
  setTimeout(() => {
    renderExcalidraw()
  }, 100)
});

onBeforeUnmount(() => {
  reactRoot?.unmount();
});
</script>

<style lang="less" scoped>
.excalidraw-editor, .excalidraw-view-wrapper {
  width: 100%;
  height: 100%;
  position: relative;
}
</style>