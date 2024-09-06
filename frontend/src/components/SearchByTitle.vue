<template>
  <div class="layout-side">
    <el-input v-model="keyword"
      :prefix-icon="Search"
      @keydown.enter="search"
      placeholder="搜索"
      class="search-input"></el-input>
    <template v-if="results.length || isEmpty">
      <h4 class="search-results-title">
        <span class="material-symbols-outlined back-icon" @click="clear">
        arrow_back
        </span>
        <span class="title-content">
        搜索结果
        </span>
      </h4>
      <ul class="search-results">
        <li class="search-result-item"
          v-for="item in results"
          :key="item.id"
          @click="toResult(item)"
        >
          {{ item.title }}
        </li>
        <li class="search-result-item empty" v-if="isEmpty">没有搜索到内容</li>
      </ul>
    </template>
  </div>
</template>

<script lang="ts" setup>
import { ref, toRaw } from 'vue';
import { Search } from '@element-plus/icons-vue';
import Fuse from 'fuse.js';
import type { ListItem } from '@/stores/document'
import router from '@/router';
import { useRuntime } from '@/stores/runtime';

const props = defineProps<{
  documents: ListItem[]
}>()

const emits = defineEmits<{
  search: [],
  clear: []
}>()

const keyword = ref('');
const results = ref<ListItem[]>([])
const isEmpty = ref(false)

const search = () => {
  const q = keyword.value.trim();
  if (!q) return;
  const fuse = new Fuse(toRaw(props.documents).slice(1), {
    keys: ['title'],
    includeMatches: true
  });
  const result = fuse.search(q);
  results.value = result.map(item => item.item)
  isEmpty.value = result.length <= 0
  emits('search')
};

const clear = () => {
  keyword.value = ''
  results.value = []
  isEmpty.value = false
  emits('clear')
}

const toResult = (result: ListItem) => {
  router.push({
    name: 'document',
    params: { id: result.id }
  })
  useRuntime().updateSettings('recentDocumentId', result.id)
}

</script>

<style lang="less" scoped>
.search-input:deep(.el-input__wrapper) {
  box-shadow: none;
  background: transparent;
}
.search-results {
  padding: 0;
  margin: 0;
}
.search-results-title {
  margin: 0;
  padding: 2px 4px;
  display: flex;
  height: 30px;
  .back-icon {
    font-size: 20px;
    margin-right: 6px;
    cursor: pointer;
    transition: background .2s;
    line-height: 30px;
    border-radius: 6px;
    &:hover {
      background: rgba(220, 220, 220, .5);
    }
  }
  .title-content {
    line-height: 30px;
  }
}
.search-result-item {
  cursor: pointer;
  padding: 6px 12px;
  border-radius: 4px;
  transition: background .2s;
  box-sizing: border-box;
  position: relative;
  font-size: 16px;
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
  max-width: 100%;
  box-sizing: border-box;
  &.empty {
    color: #bbb;
    justify-content: center;
  }
  &:hover {
    background: rgba(220, 220, 220, .5);
    .tree-action {
      opacity: 1;
    }
  }
}
</style>