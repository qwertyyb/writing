<template>
  <figure data-prosemirror-dom class="editor-image-node" :class="'align-' + node.attrs.align">
    <Resizable class="resizer" :config="{
      edge: {
        left: true,
        right: true,
      },
      border: {
        render: true,
        style: {
          headless: false,
          class: 'resizer-border',
          size: 2,
        },
      },
    }">
      <img
        class="editor-image-node-image"
        :src="node.attrs.src || 'https://fakeimg.pl/200'"
        alt=""
      >
    </Resizable>
    <figcaption data-prosemirror-content-dom class="editor-image-node-title"></figcaption>
  </figure>
</template>

<script lang="ts" setup>
import { Resizable } from 'vue-resizables'
import type { VueNodeViewProps } from '@/editor/plugins/vueNodeViews';
import { ref } from 'vue';

const props = defineProps<VueNodeViewProps>()

const resizeActived = ref(false)

defineExpose({
  selectNode() {
    console.log('selectNode')
    resizeActived.value = true
  },
  deselectNode() {
    resizeActived.value = false
  }
})

</script>

<style lang="less" scoped>
.editor-image-node {
  width: fit-content;
  margin: 0;
  position: relative;
  &.align-center {
    margin: 0 auto;
  }
  &.align-right {
    margin-left: auto;
  }
  .resizer {
    height: auto !important;
    &::v-deep(.resizer-border) {
      background: green;
    }
  }
  img.editor-image-node-image {
    width: 100%;
  }
  figcaption.editor-image-node-title {
    text-align: center;
  }
}
</style>
