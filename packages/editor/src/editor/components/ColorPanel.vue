<template>
  <div class="color-panel">
    <ul class="color-list">
      <li class="color-item"
        :style="{ [type]: item }"
        :class="{ selected: selected === item }"
        v-for="item in colors"
        :key="item"
        @pointerdown.prevent="emits('select', item)"
      >{{ type === 'color' ? 'A' : '' }}</li>
    </ul>
  </div>
</template>

<script lang="ts" setup>
withDefaults(defineProps<{ colors: string[], type: 'backgroundColor' | 'color', selected?: string }>(), { type: 'backgroundColor' })
const emits = defineEmits<{
  select: [string]
}>()
</script>

<style lang="less" scoped>
.color-list {
  --color-item-size: 20px;
  --color-item-space: 4px;
  padding: 0;
  margin: 0;
  list-style: none;
  display: flex;
  flex-wrap: wrap;
  gap: var(--color-item-space);
  width: calc(10 * var(--color-item-size) + 9 * var(--color-item-space));
}
.color-item {
  width: var(--color-item-size);
  height: var(--color-item-size);
  border: 1px solid rgba(0,0,0,0.08);
  box-sizing: border-box;
  cursor: pointer;
  text-align: center;
  line-height: var(--color-item-size);
  font-weight: bold;
  position: relative;
  &.selected::after {
    content: " ";
    position: absolute;
    inset: -3px;
    border: 1px solid #000;
  }
}
</style>