<template>
  <div class="editor-toolbar" v-if="visible" :style="{left: position.left + 'px', bottom: position.bottom + 'px'}">
    <ul class="toolbar-list">
      <li class="toolbar-item material-symbols-outlined"
        :class="{ active: !!marksValues[item.name] }"
        v-for="item in toolbar"
        :key="item.name"
        @pointerdown.prevent="handler(item)"
      >
        <el-popover trigger="click" width="fit-content" v-if="item.name === 'color' || item.name === 'backgroundColor'">
          <template #reference>
            <div class="toolbar-item-label">{{ item.label }}</div>
          </template>
          <template #default>
            <ColorPanel
              :colors="item.name === 'backgroundColor' ? backgroundColors : colors"
              :type="item.name"
              :selected="marksValues[item.name]?.attrs?.[item.name]"
              @select="handleColorSelect(item, $event)"
            />
          </template>
        </el-popover>
        <div class="toolbar-item-label" v-else>{{ item.label }}</div>
      </li>
    </ul>
  </div>
</template>

<script lang="ts">
import type { EditorView } from 'prosemirror-view';
import { ElPopover } from 'element-plus';
import ColorPanel from '@/editor/components/ColorPanel.vue';
import { defineComponent, type PropType } from 'vue';
import type { Mark } from 'prosemirror-model';

export interface ToolbarItemSpec {
  type: 'mark' | 'attr'
  name: string;
  label: string;
  handler: (view: EditorView, value?: string) => void;
}

export interface EditorToolbarProps {
  editorView: EditorView
  toolbar: ToolbarItemSpec[]
  visible: boolean
  marksValues: Record<string, Mark>
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
    marksValues: {
      type: Object as PropType<Record<string, Mark>>,
      required: true
    },
    position: {
      type: Object as PropType<EditorToolbarProps["position"]>,
      required: true
    }
  },
  components: {
    ColorPanel,
    ElPopover
  },
  data() {
    return {
      colors: [
        '#1f1f1f',
        '#858585',
        '#2972f4',
        '#00a3f5',
        '#45b076',
        '#f5c400',
        '#f88825',
        '#de3c36',
        '#dd4097',
        '#9a38d7'
      ],
      backgroundColors: [
        'transparent',
        '#f3f5f7',
        '#e5efff',
        '#e5f6ff',
        '#eafaf1',
        '#fff9e3',
        '#fff3eb',
        '#ffe9e8',
        '#ffecf4',
        '#fdebff',
        '#ebebeb',
        '#dcdfe4',
        '#c7dcff',
        '#c7ecff',
        '#ace2c5',
        '#ffeead',
        '#ffdcc4',
        '#ffc9c7',
        '#ffc7e2',
        '#f2c7ff',
      ]
    }
  },
  methods: {
    handler(item: ToolbarItemSpec) {
      if (['color', 'backgroundColor'].includes(item.name)) return;
      item.handler(this.editorView)
    },
    handleColorSelect(item: ToolbarItemSpec, color: string) {
      item.handler(this.editorView, color)
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