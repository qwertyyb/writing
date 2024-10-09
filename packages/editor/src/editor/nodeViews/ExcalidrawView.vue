<template>
  <div class="excalidraw-view" data-prosemirror-dom>
    <base-image v-bind="props" @update-attrs="updateAttrs">
      <template #menu v-if="props.view?.editable">
        <li class="action-item material-symbols-outlined"
          title="编辑"
          @click="launchEditor"
        >
          edit
        </li>
        <li class="action-item material-symbols-outlined"
          title="删除"
          @click="remove"
        >
          delete
        </li>
      </template>
    </base-image>
    <el-dialog title="编辑" class="excalidraw-editor-dialog" v-model="editorVisible" destroy-on-close fullscreen :z-index="900" append-to-body>
      <excalidraw-editor :initial-data="editorInitialData"
        @change="changeHandler"></excalidraw-editor>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { inject, markRaw, onMounted, ref, shallowRef } from 'vue';
import type { VueNodeViewProps } from '../plugins/vueNodeViews';
import BaseImage from './components/BaseImage.vue'
import type { exportToSvg, exportToBlob, loadFromBlob, serializeAsJSON } from '@excalidraw/excalidraw/types/packages/utils'
import type { ExcalidrawElement } from '@excalidraw/excalidraw/types/element/types';
import { ElDialog, ElMessageBox } from 'element-plus';
import { uploadSymbol } from '../const';
import type { Attrs } from 'prosemirror-model';
import ExcalidrawEditor from './components/ExcalidrawEditor.vue';
import type { RestoredDataState } from '@excalidraw/excalidraw/types/data/restore';
// import defaultExcalidrawPath from './components/default.excalidraw.svg?url'
import defaultExcalidrawPath from './components/default.excalidraw.png?url'

const props = defineProps<VueNodeViewProps>()

const updateAttrs = (attrs: Partial<Attrs>) => {
  const tr = props.view!.state.tr
  
  tr.setMeta('addToHistory', false)
  const pos = props.getPos!()
  Object.entries(attrs).forEach(([key, value]) => {
    tr.setNodeAttribute(pos, key, value)
  })
  props.view?.dispatch(tr)
}

const editorVisible = ref(false)
const editorInitialData = shallowRef<RestoredDataState>()

const launchEditor = async () => {
  const response = await fetch(props.node.attrs.src, { cache: 'no-store' })
  const blob = await response.blob()
  const initialData = markRaw(await window.ExcalidrawLib.loadFromBlob(blob, null, null))
  editorInitialData.value = initialData
  editorVisible.value = true
  console.log(initialData)
}

onMounted(async () => {
  if (props.node.attrs.src || !props.view?.editable || !upload) return
  const blob = await (await fetch(defaultExcalidrawPath)).blob()
  // const defaultData: any = {"type":"excalidraw","version":2,"source":"https://excalidraw.com","elements":[{"id":"OlaFIYDX0RCnPSwH-o_Cq","type":"rectangle","x":693.880126953125,"y":267.1289978027344,"width":368.6529541015625,"height":245.14700317382,"angle":0,"strokeColor":"#2f9e44","backgroundColor":"transparent","fillStyle":"solid","strokeWidth":2,"strokeStyle":"solid","roughness":1,"opacity":100,"groupIds":[],"frameId":null,"index":"aL","roundness":{"type":3},"seed":565917905,"version":79,"versionNonce":246096721,"isDeleted":false,"boundElements":[{"type":"text","id":"fs3jUDQyzn97Evdmnvezz"}],"updated":1728379797386,"link":null,"locked":false},{"id":"fs3jUDQyzn97Evdmnvezz","type":"text","x":785.5066390633583,"y":367.20249938964844,"width":185.3999298810959,"height":45,"angle":0,"strokeColor":"#2f9e44","backgroundColor":"transparent","fillStyle":"solid","strokeWidth":2,"strokeStyle":"solid","roughness":1,"opacity":100,"groupIds":[],"frameId":null,"index":"aM","roundness":null,"seed":791269919,"version":12,"versionNonce":2066774943,"isDeleted":false,"boundElements":null,"updated":1728379800186,"link":null,"locked":false,"text":"Excalidraw","fontSize":36,"fontFamily":1,"textAlign":"center","verticalAlign":"middle","containerId":"OlaFIYDX0RCnPSwH-o_Cq","originalText":"Excalidraw","autoResize":true,"lineHeight":1.25}],"appState":{"gridSize":20,"gridStep":5,"gridModeEnabled":false,"viewBackgroundColor":"#ffffff"},"files":{}}
  // const svg = await window.ExcalidrawLib.exportToSvg({
  //   elements: defaultData.elements,
  //   appState: { ...defaultData.appState, exportEmbedScene: true },
  //   files: defaultData.files
  // })
  const file = new File([await blob.arrayBuffer()], 'exportToCanvas.excalidraw.png', {type: 'image/png'})
  // const file = new File([await blob.arrayBuffer()],  'exportToCanvas.excalidraw.svg', {type: blob.type})
  const src = await upload(file)
  updateAttrs({ src })
})

declare global {
  interface Window {
    React: any
    ReactDOM: any
    ExcalidrawLib: {
      Excalidraw: ExcalidrawElement,
      exportToSvg: typeof exportToSvg,
      exportToBlob: typeof exportToBlob,
      loadFromBlob: typeof loadFromBlob,
      serializeAsJSON: typeof serializeAsJSON,
    }
  }
}

const upload = inject<(file: File, options?: { previous?: string }) => Promise<string>>(uploadSymbol)

const remove = async () => {
  if (!props.view || !props.getPos) return
  await ElMessageBox.confirm('确认删除？')
  const from = props.getPos()
  props.view.dispatch(props.view.state.tr.delete(from, from + 1))
}

const changeHandler = async (data: RestoredDataState) => {
  if (!props.view) return
  const blob = await window.ExcalidrawLib.exportToBlob({
    elements: data.elements,
    appState: { ...data.appState, exportEmbedScene: true },
    files: data.files,
    mimeType: 'image/png',
    getDimensions(width, height) {
      const scale = 3
      return { width: width * scale, height: height * scale, scale }
    },
  })
  const file = new File([await blob.arrayBuffer()],  'exportToCanvas.excalidraw.png', {type: blob.type})

  // const svg = await window.ExcalidrawLib.exportToSvg({
  //   elements: data.elements,
  //   appState: { ...data.appState, exportEmbedScene: true },
  //   files: data.files
  // })
  // const file = new File([svg.outerHTML], 'exportToCanvas.excalidraw.svg', {type: 'image/svg+xml'})
  if (upload) {
    const src = await upload(file, { previous: props.node.attrs.src })
    updateAttrs({ src })
  }
}

defineExpose({
  stopEvent() {
    return true
  },
  selectNode() {
    console.log('select')
  },
  deselectNode() {

  }
})

</script>

<style lang="less">
.excalidraw-editor-dialog {
  .el-dialog__body {
    height: calc(100% - 40px);
  }
}
</style>

<style lang="less" scoped>
// 中文手写体
@font-face {
  font-family: "Virgil";
  src: url("../../assets/Muyao-Softbrush-2.ttf");
}
.excalidraw-view {
  user-select: none;
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