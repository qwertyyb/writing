<template>
  <div class="command-tool" ref="el"
    v-if="visible"
    :style="{left: position.left + 'px', top: position.top + 'px'}">
    <ul class="command-tool-list">
      <li class="command-tool-item"
        :class="{ selected: index === selectedIndex }"
        v-for="(command, index) in visibleCommands"
        :key="command.label"
        @click="commandHandler(command)"
      >{{ command.label }}</li>
      <li class="command-tool-item"
        v-if="visibleCommands.length <= 0">未找到结果</li>
    </ul>
  </div>
</template>

<script lang="ts">
import type { EditorView } from 'prosemirror-view';
import { defineComponent, type PropType } from 'vue';

export interface BlockToolItemSpec {
  label: string
  keyword: string
  handler: (view: EditorView) => void
}

export interface BlockToolsProps {
  blocks: BlockToolItemSpec[],
  editorView: EditorView,
  keyword: string,
  position: { left: number, top: number },
  visible: boolean
}

export default defineComponent({
  props: {
    blocks: {
      type: Array as PropType<BlockToolItemSpec[]>,
      required: true
    },
    keyword: {
      type: String,
      required: true
    },
    visible: {
      type: Boolean,
      require: true
    },
    editorView: {
      type: Object as PropType<EditorView>,
      required: true
    },
    position: {
      type: Object as PropType<{ left: number, top: number }>,
      required: true
    }
  },
  data(): { selectedIndex: number } {
    return {
      selectedIndex: 0
    }
  },
  computed: {
    visibleCommands(): BlockToolItemSpec[] {
      if (!this.keyword) return this.blocks
      return this.blocks.filter(block => [block.keyword, block.label].some(text => text.includes(this.keyword)))
    }
  },
  watch: {
    keyword() {
      this.selectedIndex = 0
    },
    async selectedIndex() {
      await this.$nextTick();
      (this.$el as HTMLElement).querySelector<HTMLElement>('.command-tool-item.selected')?.scrollIntoView({
        block: 'nearest'
      })
    },
    visible(val) {
      if (val) {
        this.editorView.dom.removeEventListener('keydown', this.keydownHandler, true)
        this.editorView.dom.addEventListener('keydown', this.keydownHandler, true)
      } else {
        this.editorView.dom.removeEventListener('keydown', this.keydownHandler, true)
      }
    }
  },
  methods: {
    keydownHandler(event: KeyboardEvent) {
      if (['ArrowDown', 'ArrowUp', 'Escape', 'Enter'].includes(event.key)) {
        event.preventDefault()
        event.stopImmediatePropagation()
        event.stopPropagation()
      }
      if (event.key === 'ArrowUp') {
        this.selectedIndex = (this.selectedIndex - 1 + this.visibleCommands.length) % this.visibleCommands.length
      } else if (event.key === 'ArrowDown') {
        this.selectedIndex = (this.selectedIndex + 1) % this.visibleCommands.length
      } else if (event.key === 'Enter') {
        const command = this.visibleCommands[this.selectedIndex]
        if (!command) return null
        this.commandHandler(command)
      } else if (event.key === 'Escape') {
        this.$emit('close')
      }
    },
    commandHandler(command: BlockToolItemSpec) {
      command.handler(this.editorView)
    }
  }
})

</script>

<style lang="less" scoped>
.command-tool {
  box-shadow: 0 3px 15px -3px rgba(13,20,33,.13);
  border: 1px solid #e8e8eb;
  border-radius: 6px;
  padding: 4px;
  position: absolute;
  background: #fff;
  color: rgba(100, 100, 100, 1);
  min-width: 200px;
  z-index: 99;
  .command-tool-list {
    list-style: none;
    margin: 6px 0;
    padding: 0;
    max-height: 200px;
    overflow: auto;
    &::-webkit-scrollbar {
      border: none;
      width: 8px;
    }
    &::-webkit-scrollbar-thumb {
      background-color: #ddd;
      border-radius: 100px;
    }
  }
  .command-tool-item {
    padding: 8px 18px;
    font-size: 14px;
    border-radius: 6px;
    cursor: pointer;
    &:hover {
      background: rgba(236, 237, 240, 0.8)
    }
    &.selected {
      background: rgba(241, 238, 238, 0.8)
    }
  }
}
</style>