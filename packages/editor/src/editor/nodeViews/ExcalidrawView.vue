<template>
  <div class="excalidraw-view">
    <el-tooltip
      placement="top"
      width="fit-content"
      :disabled="!editable"
      :trigger-keys="[]"
    >
      <div class="excalidraw-view-wrapper"
        :class="{fullsize}"
        :style="{
          width: node.attrs.size + '%',
          marginLeft: node.attrs.align === 'left' ? '0' : 'auto',
          marginRight: node.attrs.align === 'right' ? '0' : 'auto'
        }"
        ref="el"
      ></div>
      <template #content>
        <ul class="action-list">
          <li class="action-item remove-action material-symbols-outlined"
            @click="remove"
            title="删除"
          >delete</li>
          <li class="action-item align-action material-symbols-outlined"
            :class="{selected: node.attrs.align === 'left'}"
            @click="$emit('updateAttrs', { align: 'left' })"
            title="左对齐"
          >align_horizontal_left</li>
          <li class="action-item align-action material-symbols-outlined"
            :class="{selected: node.attrs.align === 'center'}"
            @click="$emit('updateAttrs', { align: 'center' })"
            title="居中对齐"
          >align_horizontal_center</li>
          <li class="action-item align-action material-symbols-outlined"
            :class="{selected: node.attrs.align === 'right'}"
            @click="$emit('updateAttrs', { align: 'right' })"
            title="右对齐"
          >align_horizontal_right</li>
          <li class="action-item size-action" title="调整大小">
            <ElSlider
              :model-value="node.attrs.size"
              :min="10" :max="100"
              @update:model-value="$emit('updateAttrs', { size: $event })"
            ></ElSlider>
          </li>
        </ul>
      </template>
    </el-tooltip>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import type { VueNodeViewProps } from '../plugins/vueNodeViews';
import type { AppState, BinaryFiles } from '@excalidraw/excalidraw/types/types';
import type { ExcalidrawElement } from '@excalidraw/excalidraw/types/element/types';
import { debounce, isEqual, pick } from 'lodash-es';
import { ElTooltip, ElSlider } from 'element-plus';

const props = defineProps<VueNodeViewProps>()

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

const remove = () => {
  if (!props.view || !props.getPos) return
  const from = props.getPos()
  props.view.dispatch(props.view.state.tr.delete(from, from + 1))
}

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

const changeHandler = debounce((elements: ExcalidrawElement[], appState: AppState, files: BinaryFiles) => {
  if (!props.view) return
  const data = getExportedState({ elements, appState, files })
  if (isEqual(data, JSON.parse(props.node.attrs.content))) {
    return
  }
  let tr = props.view.state.tr
  tr = tr.setMeta('addToHistory', false)
  tr.setNodeAttribute(props.getPos!(), 'content', JSON.stringify(data) )
  props.view.dispatch(tr)
}, 200)

let reactRoot: any = null
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
          renderTopRightUI: () => {
            return window.React.createElement(
              'button',
              {
                className: 'material-symbols-outlined',
                style: { border: 'none', borderRadius: '6px', width: '36px', height: '36px', fontSize: '14px' },
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
// 中文手写体
@font-face {
  font-family: "Virgil";
  src: url("../../assets/Muyao-Softbrush-2.ttf");
}
.excalidraw-view {
  .excalidraw-view-wrapper {
    width: 100%;
    height: 100%;
    aspect-ratio: 1 / 1;
    border: 1px solid #ddd;
    max-height: 100vh;
    border-radius: 4px;
    overflow: hidden;
    &:focus-within {
      outline: 2px solid #17789e;
    }
    &.fullsize {
      width: 100vw;
      height: 100vh;
      position: fixed;
      inset: 0;
      z-index: 1;
      margin: 0 !important;
      width: 100% !important;
    }
  }
}
.action-list {
  display: flex;
  align-items: center;
  margin: 0;
  padding: 0;
  list-style: none;
  gap: 10px;
  .action-item {
    cursor: pointer;
    transition: background .2s;
    font-size: 18px;
    padding: 3px;
    border-radius: 4px;
    &.selected {
      background: rgb(198, 198, 198);
    }
    &:hover {
      background: gainsboro;
    }
    &.size-action:hover {
      background: none;
    }
  }
  .action-item.size-action {
    width: 200px;
    margin-left: 10px;
  }
}
</style>