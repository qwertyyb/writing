<template>
  <div class="note-info">
    <div class="note-info-row">
      <div class="note-info-label">创建时间</div>
      <div class="note-info-value">{{ dateFormat(note.createdAt) }}</div>
    </div>
    <div class="note-info-row">
      <div class="note-info-label">更新时间</div>
      <div class="note-info-value">{{ dateFormat(note.updatedAt) }}</div>
    </div>

    <div class="note-info-row" v-for="attr in note.attributes" :key="attr.key">
      <div class="note-info-label">{{ attr.options?.label || attr.key }}</div>
      <div class="note-info-value">{{ formatAttrValue(attr) }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { IWritingAttribute, IWritingNote } from '@writing/types';

const props = defineProps<{ note: IWritingNote }>()

const dateFormat = (val: string) => new Date(val).toLocaleString()

const formatAttrValue = (attr: IWritingAttribute) => {
  if (!attr.value || !attr.options) return attr.value
  if (attr.options.formatValue === 'date') return dateFormat(attr.value)
  return attr.value
}
</script>

<style lang="less" scoped>
.note-info-row {
  display: flex;
  align-items: center;
  margin-bottom: 16px;
  .note-info-label {
    width: 160px;
    text-align: right;
    font-weight: bold;
    margin-right: 8px;
    color: #000;
  }
  .note-info-value {
    flex: 1;
  }
}
</style>