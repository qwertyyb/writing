
<template>
  <div class="emoji-panel">
    <div class="select-bar" v-if="props.search">
      <el-input size="small" v-model.trim="keyword"></el-input>
      <el-button size="small"
        style="width:24px;margin-left:8px"
        title="随机"
        @click="random">
        <span class="material-symbols-outlined">shuffle</span>
      </el-button>
    </div>
    <ul class="emoji-list" ref="emojiContainer">
      <li class="emoji-item"
        v-for="(item, index) in emojis"
        :key="item.emoji"
        :title="`${item.names[0]}: ${item.description}`"
        :class="{selected: index === selectedIndex}"
        @click="$emit('change', item.emoji)"
      >{{ item.emoji }}</li>
    </ul>
  </div>
</template>

<script lang="ts" setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { gemoji } from 'gemoji'
import { ElInput, ElButton } from 'element-plus'

const props = defineProps<{ search?: boolean, query?: string }>()

const emits = defineEmits<{ change: [string] }>()

const keyword = ref('');
const selectedIndex = ref(0)
const emojiContainer = ref<HTMLElement>()

const emojis = computed(() => {
  const query = props.search ? keyword.value : props.query
  if (!query) return gemoji;
  return gemoji.filter(item => item.names.some(name => name.includes(query)))
})

watch(
  () => props.search ? props.query : keyword.value,
  async () => {
    selectedIndex.value = 0
  }
)

watch(selectedIndex, async () => {
  await nextTick()
  // @ts-ignore
  emojiContainer.value?.querySelector<HTMLDivElement>('.emoji-item.selected')?.scrollIntoViewIfNeeded(false)
})

const random = () => {
  const index = Math.floor(emojis.value.length * Math.random());
  emits('change', emojis.value[index].emoji);
};

const keydownHandler = (event: KeyboardEvent) => {
  if (!emojis.value.length) return;
  const stop = () => {
    event.stopPropagation()
    event.preventDefault()
  }
  if (event.key === 'ArrowRight') {
    stop()
    selectedIndex.value = (selectedIndex.value + 1) % emojis.value.length
  } else if (event.key === 'ArrowLeft') {
    stop()
    selectedIndex.value = (selectedIndex.value - 1 + emojis.value.length) % emojis.value.length
  } else if (event.key === 'ArrowDown') {
    const lineItemCount = Math.floor(emojiContainer.value!.getBoundingClientRect().width / 32)
    stop()
    const curLine = Math.floor(selectedIndex.value / lineItemCount)
    const totalLines = Math.floor((emojis.value.length - 1) / lineItemCount) + 1
    const nextLine = (curLine + 1) % totalLines
    const next = nextLine * lineItemCount + selectedIndex.value % lineItemCount
    selectedIndex.value = Math.min(next, emojis.value.length - 1)
  } else if (event.key === 'ArrowUp') {
    const lineItemCount = Math.floor(emojiContainer.value!.getBoundingClientRect().width / 32)
    stop()
    const curLine = Math.floor(selectedIndex.value / lineItemCount)
    const totalLines = Math.floor((emojis.value.length - 1) / lineItemCount) + 1
    const nextLine = (curLine - 1 + totalLines) % totalLines
    const next = nextLine * lineItemCount + selectedIndex.value % lineItemCount
    selectedIndex.value = Math.max(next, 0)
  } else if (event.key === 'Enter') {
    stop()
    emits('change', emojis.value[selectedIndex.value].emoji)
  } else if (event.key === 'Escape') {
    stop()
  }
}

onMounted(() => {
  document.addEventListener('keydown', keydownHandler, true)
})

onBeforeUnmount(() => {
  document.removeEventListener('keydown', keydownHandler, true)
})

</script>

<style lang="less" scoped>
.emoji-panel {
  .select-bar {
    display: flex;
  }
  .emoji-list {
    width: 300px;
    height: 320px;
    overflow: auto;
    display: grid;
    grid-template-columns: repeat(auto-fill, 32px);
    font-size: 26px;
    align-content: start;
    margin: 8px 0 0 0;
    padding: 0;
    &::-webkit-scrollbar {
      width: 6px;
      background: #ddd;
      border-radius: 2px;
    }
    &::-webkit-scrollbar-thumb {
      background: #999;
      border-radius: 2px;
    }
    .emoji-item {
      width: 32px;
      height: 32px;
      line-height: 32px;
      text-align: center;
      cursor: pointer;
      border-radius: 4px;
      transition: background .2s, transform .2s;
      content-visibility: auto;
      contain-intrinsic-size: 32px;
      &:hover, &.selected {
        background: #dedede;
        transform: scale(1.2);
      }
    }
  }
}
</style>