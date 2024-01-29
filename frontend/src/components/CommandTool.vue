<template>
  <div class="command-tool">
    <ul class="command-tool-list">
      <li class="command-tool-item"
        :class="{ selected: index === selectedIndex }"
        v-for="(command, index) in visibleCommands" :key="command.value">{{ command.label }}</li>
      <li class="command-tool-item" v-if="visibleCommands.length <= 0">未找到结果</li>
    </ul>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from 'vue';

const props = defineProps({
  keyword: {
    type: String,
    default: ''
  }
})

const selectedIndex = ref(0)

const commands = [
  { label: '文本', value: 'text' },
]

watch(() => props.keyword, () => selectedIndex.value = 0)

const visibleCommands = computed(() => {
  if (!props.keyword) return commands
  return commands.filter(command => command.value.includes(props.keyword))
})

defineExpose({
  selectPrev() {
    selectedIndex.value = (selectedIndex.value - 1 + visibleCommands.value.length) % visibleCommands.value.length
  },
  selectNext() {
    selectedIndex.value = (selectedIndex.value + 1) % visibleCommands.value.length
  },
  confirm() {
    const command = visibleCommands.value[selectedIndex.value]
    console.log('confirm', command)
    if (!command) return null
    return command
  }
})

</script>

<style lang="less" scoped>
.command-tool {
  box-shadow: 0 3px 15px -3px rgba(13,20,33,.13);
  border: 1px solid #e8e8eb;
  border-radius: 6px;
  padding: 0;
  position: absolute;
  background: #fff;
  color: rgba(100, 100, 100, 1);
  .command-tool-list {
    list-style: none;
    margin: 6px 0;
    padding: 0;
  }
  .command-tool-item {
    padding: 4px 18px;
    font-size: 14px;
    cursor: pointer;
    &:hover {
      background: rgba(236, 237, 240, 0.8)
    }
    &.selected {
      background: rgba(220, 220, 220, 0.8)
    }
  }
}
</style>