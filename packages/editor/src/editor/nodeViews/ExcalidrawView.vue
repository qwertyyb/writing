<template>
  <div class="excalidraw-view">
    <div class="excalidraw-wrapper"
      :class="{fullsize}"
      ref="el"
    ></div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import type { VueNodeViewProps } from '../plugins/vueNodeViews';
import type { AppState, BinaryFiles, ExcalidrawImperativeAPI } from '@excalidraw/excalidraw/types/types';
import type { ExcalidrawElement } from '@excalidraw/excalidraw/types/element/types';
import { cloneDeep, debounce, isEqual, pick } from 'lodash-es';
import type { Attrs } from 'prosemirror-model';
import { closeHistory } from 'prosemirror-history';

const props = defineProps<VueNodeViewProps>()
const emits = defineEmits<{ updateAttrs: [Attrs] }>()

declare global {
  interface Window {
    React: any
    ReactDOM: any
    ExcalidrawLib: any
  }
}

const el = ref<HTMLDivElement>();

const editable = computed(() => props.view?.editable !== false)
const fullsize = ref(false)
let ignoreNextChange = false

// watch(() => props.node, (node) => {
//   if (!excalidrawAPI) return
//   const state = JSON.parse(node.attrs.content)
//   if (isEqual(state, getExportedState(excalidrawAPI.getAppState()))) {
//     return
//   }
//   console.log('updateFromParent before')
//   ignoreNextChange = true
//   excalidrawAPI.updateScene(state)
//   console.log('updateFromParent after')
// })

const getExportedState = (state: {
  elements: ExcalidrawElement[], appState: AppState, files: BinaryFiles
}) => {
  const { elements, files, appState } = state
  return {
    elements,
    files,
    appState: pick(appState, ['gridSize', 'gridStep', 'gridModeEnabled', 'viewBackgroundColor'])
  }
}

const changeHandler = (() => {
  let prevData: any = null
  return debounce((elements: ExcalidrawElement[], appState: AppState, files: BinaryFiles) => {
    // if (ignoreNextChange) {
    //   ignoreNextChange = false
    //   return
    // }
    ignoreNextChange = false
    console.log('changeHandler')
    const data = getExportedState({ elements, appState, files })
    if (isEqual(data, JSON.parse(props.node.attrs.content))) {
      return
    }
    prevData = cloneDeep(data)
    // emits('updateAttrs', { content: JSON.stringify(data) })
    if (!props.view) return
    let tr = props.view.state.tr
    tr = tr.setMeta('addToHistory', false)
    tr.setNodeAttribute(props.getPos!(), 'content', JSON.stringify(data) )
    props.view.dispatch(tr)
  }, 200)
})()

let reactRoot: any = null
let excalidrawAPI: ExcalidrawImperativeAPI | null = null
const renderExcalidraw = () => {
  const { content } = props.node.attrs
  let initialData = null
  if (content) {
    try {
      initialData = JSON.parse(content)
    } catch (err) {
      console.error(err)
    }
  }
  const App = () => {
    return window.React.createElement(
      window.React.Fragment,
      null,
      window.React.createElement(
        window.ExcalidrawLib.Excalidraw,
        {
          initialData: {
            ...initialData,
            scrollToContent: true,
          },
          excalidrawAPI: (api: ExcalidrawImperativeAPI) => { excalidrawAPI = api },
          renderTopRightUI: () => {
            return window.React.createElement(
              'button',
              {
                className: 'material-symbols-outlined',
                style: { border: 'none', borderRadius: '6px' },
                onClick: () => {
                  fullsize.value = !fullsize.value
                }
              },
              fullsize.value ? 'fullscreen_exit' : 'fullscreen'
            );
          },
          onChange: changeHandler,
          langCode: 'zh-CN',
          viewModeEnabled: !editable.value,
        }
      ),
    );
  };

  reactRoot = window.ReactDOM.createRoot(el.value!);
  reactRoot.render(window.React.createElement(App));
}

onMounted(() => {
  renderExcalidraw()
});

onBeforeUnmount(() => {
  reactRoot?.unmount();
});

defineExpose({
  stopEvent() {
    return true
  },
  selectNode() {
    el.value?.querySelector<HTMLElement>('.excalidraw-container')?.focus()

  },
  deselectNode() {
    el.value?.querySelector<HTMLElement>('.excalidraw-container')?.focus()
  }
})

</script>

<style lang="less" scoped>
.excalidraw-view {
  .excalidraw-wrapper {
    width: 100%;
    height: 100%;
    aspect-ratio: 1 / 1;
    border: 1px solid #ddd;
    max-height: 100vh;
    box-sizing: border-box;
    border-radius: 4px;
    overflow: hidden;
    &:focus-within {
      border: 2px solid #17789e;
    }
    &.fullsize {
      width: 100vw;
      height: 100vh;
      position: fixed;
      inset: 0;
      z-index: 1;
    }
  }
}
</style>