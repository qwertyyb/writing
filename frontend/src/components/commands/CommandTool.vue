<template>
  <div class="command-tool">
    <div class="command-search-wrapper">
      <input class="command-search-input"
        v-model="keyword"
        @keydown="onKeydown"
        @blur="onInputBlur"
        placeholder="Filter"
        autofocus
        ref="searchInput"/>
    </div>
    <ul class="command-tool-list">
      <li class="command-tool-item"
        :class="{ selected: index === selectedIndex }"
        v-for="(command, index) in visibleCommands" :key="command.identifier">{{ command.label }}</li>
      <li class="command-tool-item" v-if="visibleCommands.length <= 0">未找到结果</li>
    </ul>
  </div>
</template>

<script lang="ts" setup>
import { computed, onMounted, ref, watch } from 'vue';
import commands from '../commands';

const emits = defineEmits<{
  confirm: [command: any],
  exit: [options?: { autofocus: boolean }]
}>()

const keyword = ref('')
const searchInput = ref<HTMLInputElement>()

const selectedIndex = ref(0)

const visibleCommands = computed(() => {
  if (!keyword.value) return commands
  return commands.filter(command => command.identifier.includes(keyword.value))
})

onMounted(() => {
  searchInput.value?.focus()
})

watch(keyword, () => selectedIndex.value = 0)

const onKeydown = (event: KeyboardEvent) => {
  if (event.code === 'ArrowUp') {
    selectedIndex.value = (selectedIndex.value - 1 + visibleCommands.value.length) % visibleCommands.value.length
  } else if (event.code === 'ArrowDown') {
    selectedIndex.value = (selectedIndex.value + 1) % visibleCommands.value.length
  } else if (event.code === 'Enter' || event.code === 'Space') {
    // 回车或空格时，确认选中的command
    event.preventDefault()
    const command = visibleCommands.value[selectedIndex.value]
    if (!command) return null
    emits('confirm', command)
  } else if (event.code === 'Backspace' && keyword.value.length === 0) {
    // 已没有字符可删除，关闭
    event.preventDefault()
    emits('exit', { autofocus: true })
  }
}

const onInputBlur = () => {
  // 等待处理完其它事件之后再关闭组件
  setTimeout(() => {
    emits('exit', { autofocus: false })
  })
}

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
  .command-search-wrapper {
    display: flex;
  }
  .command-search-input {
    flex: 1;
    border: none;
    outline: none;
    border-radius: 6px;
    font-size: 14px;
    background: rgb(247, 245, 245);
    height: 20px;
    padding: 4px 12px;
  }
  .command-tool-list {
    list-style: none;
    margin: 6px 0;
    padding: 0;
  }
  .command-tool-item {
    padding: 4px 18px;
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