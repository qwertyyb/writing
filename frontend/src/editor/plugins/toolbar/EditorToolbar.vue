<template>
  <div class="editor-toolbar" v-if="visible" :style="{left: position.left + 'px', top: position.top + 'px'}">
    <ul class="toolbar-list">
      <li class="toolbar-item material-symbols-outlined"
        :class="{ active: !!marksValues[item.name] }"
        v-for="item in toolbar"
        :key="item.name"
      >
        <el-popover trigger="click" width="fit-content" v-if="item.name === 'color' || item.name === 'backgroundColor'">
          <template #reference>
            <div class="toolbar-item-label" :title="item.title">{{ item.label }}</div>
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
        <el-popover trigger="click" width="fit-content"
          ref="linkPopover"
          v-else-if="item.name === 'link'">
          <template #reference>
            <div class="toolbar-item-label" :title="item.title">{{ item.label }}</div>
          </template>
          <template #default>
            <LinkInput :href="marksValues[item.name]?.attrs?.href"
              @change="linkChangeHandler(item, $event)"
              @clear="linkChangeHandler(item, null)"
            ></LinkInput>
          </template>
        </el-popover>
        <div class="toolbar-item-label" :title="item.title" v-else @pointerdown.prevent="handler(item)">{{ item.label }}</div>
      </li>
    </ul>
  </div>
</template>

<script lang="ts">
import type { EditorView } from 'prosemirror-view';
import { ElPopover } from 'element-plus';
import ColorPanel from '@/editor/components/ColorPanel.vue';
import LinkInput from '@/editor/components/LinkInput.vue';
import { defineComponent, type PropType } from 'vue';
import type { Mark } from 'prosemirror-model';

export interface ToolbarItemSpec {
  name: string;
  label: string;
  title: string;
  handler: (view: EditorView, marksValues: Record<string, Mark>, value?: string | null | { href: string }) => void;
}

export interface EditorToolbarProps {
  editorView: EditorView
  toolbar: ToolbarItemSpec[]
  visible: boolean
  marksValues: Record<string, Mark>
  position: { left: number, top: number }
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
    ElPopover,
    LinkInput
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
      item.handler(this.editorView, this.marksValues)
    },
    handleColorSelect(item: ToolbarItemSpec, color: string) {
      item.handler(this.editorView, this.marksValues, color)
    },
    linkChangeHandler(item: ToolbarItemSpec, value: { href: string } | null) {
      console.log(this.$refs.linkPopover as any);
      (this.$refs.linkPopover as InstanceType<typeof ElPopover>[] | undefined)?.[0]?.hide()
      item.handler(this.editorView, this.marksValues, value)
    }
  }
})
</script>

<style lang="less" scoped>
.editor-toolbar {
  position: absolute;
  transform: translateY(-100%);
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