<template>
  <div class="editor-toolbar" v-if="visible" :style="{left: position.left + 'px', bottom: position.bottom + 'px'}">
    <ul class="toolbar-list">
      <li class="toolbar-item material-symbols-outlined"
        :class="{ active: activeMarks[item.name] }"
        v-for="item in toolbar"
        :key="item.name"
        @pointerdown.prevent="handler(item)"
      >{{ item.label }}</li>
    </ul>
  </div>
</template>

<script lang="ts">
import type { EditorView } from 'prosemirror-view';
import { defineComponent, type PropType } from 'vue';

export interface ToolbarItemSpec {
  name: string;
  label: string;
  handler: (view: EditorView) => void;
}

export interface EditorToolbarProps {
  editorView: EditorView
  toolbar: ToolbarItemSpec[]
  visible: boolean
  activeMarks: Record<string, boolean | string>
  position: { left: number, bottom: number }
}

export default defineComponent({
  props: {
    editorView: {
      type: Object as PropType<EditorView>,
      required: true
    },
    toolbar: {
      type: Array as PropType<ToolbarItemSpec[]>,
      required: true
    },
    visible: {
      type: Boolean,
      required: true
    },
    activeMarks: {
      type: Object as PropType<Record<string, boolean | string>>,
      required: true
    },
    position: {
      type: Object as PropType<EditorToolbarProps["position"]>,
      required: true
    }
  },
  methods: {
    handler(item: ToolbarItemSpec) {
      item.handler(this.editorView)
    }
  }
})
</script>

<style lang="less" scoped>
.editor-toolbar {
  position: absolute;
}
.toolbar-list {
  display: flex;
  background: #000;
  color: #fff;
  list-style: none;
  padding: 0;
  margin: 0;
  .toolbar-item {
    cursor: pointer;
    padding: 6px 10px;
    font-size: 20px;
    &.active {
      background: gray;
    }
  }
}
</style>