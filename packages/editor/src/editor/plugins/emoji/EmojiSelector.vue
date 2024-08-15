<template>
  <div class="emoji-selector"
    v-if="visible"
    :style="{top: position.top + 'px', left: position.left + 'px'}"
    ref="el"
  >
    <div class="emoji-item"
      v-for="(emoji, index) in emojiList"
      :key="emoji.emoji"
      @click.stop="insertEmoji(emoji)"
      :class="{selected: index === selectedIndex }"
    >
      <span class="emoji">{{ emoji.emoji }}</span>
      <span class="emoji-name">{{ emoji.names[0] }}</span>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { gemoji, type Gemoji } from 'gemoji';
import { TextSelection } from 'prosemirror-state';
import type { EditorView } from 'prosemirror-view';
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';

const props = defineProps<{
  visible: boolean,
  query: string,
  position: { top: number, left: number },
  view: EditorView
}>()

const selectedIndex = ref(0)
const el = ref<HTMLElement>()

const emojiList = computed(() => {
  return gemoji.filter(emoji => emoji.names.some(name => name.includes(props.query)))
})

watch(() => props.query, () => {
  selectedIndex.value = 0
})

const insertEmoji = (emoji: Gemoji) => {
  const { selection } = props.view.state
  const tr = props.view.state.tr
  props.view.dispatch(
    tr
      .replaceRangeWith(selection.to - props.query.length - 1, selection.to, props.view.state.schema.text(emoji.emoji))
      .setSelection(TextSelection.create(tr.doc, selection.to - props.query.length))
  )
}

const keydownHandler = (event: KeyboardEvent) => {
  if (!props.visible || !emojiList.value.length) return;
  if (event.key === 'ArrowDown') {
    event.stopPropagation()
    event.preventDefault()
    selectedIndex.value = (selectedIndex.value + 1) % emojiList.value.length
  } else if (event.key === 'ArrowUp') {
    event.stopPropagation()
    event.preventDefault()
    selectedIndex.value = (selectedIndex.value - 1 + emojiList.value.length) % emojiList.value.length
  } else if (event.key === 'Enter') {
    event.stopPropagation()
    event.preventDefault()
    insertEmoji(emojiList.value[selectedIndex.value])
  }
}

onMounted(() => {
  props.view.dom.addEventListener('keydown', keydownHandler, true)
})

onBeforeUnmount(() => {
  props.view.dom.removeEventListener('keydown', keydownHandler, true)
})

</script>

<style lang="less" scoped>
.emoji-selector {
  position: absolute;
  width: 200px;
  height: 200px;
  background: #fff;
  box-shadow: 0 0 6px #959595;
  overflow: auto;
  &::-webkit-scrollbar {
    display: none;
  }
  .emoji-item {
    height: 28px;
    display: flex;
    padding: 0 6px;
    cursor: pointer;
    &:hover, &.selected {
      background: rgba(0, 0, 0, .1);
    }
    .emoji {
      margin-right: 6px;
    }
  }
}
</style>