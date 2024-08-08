<template>
  <div class="callout-view">
    <el-popover trigger="click" width="auto">
      <template #reference>
        <div class="callout-icon">{{ node.attrs.icon }}</div>
      </template>
      <div class="callout-icon-select-panel">
        <div class="select-bar">
          <el-input size="small" v-model.trim="keyword"></el-input>
          <el-button size="small"
            style="width:24px;margin-left:8px"
            title="随机"
            @click="random">
            <span class="material-symbols-outlined">shuffle</span>
          </el-button>
        </div>
        <div class="emoji-panel">
          <div class="emoji-item"
            v-for="item in emojis"
            :key="item.emoji"
            :title="`${item.names[0]}: ${item.description}`"
            @click="update({ icon: item.emoji })"
          >{{ item.emoji }}</div>
        </div>
      </div>
    </el-popover>
    <div class="callout-content" data-prosemirror-content-dom>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ElPopover, ElInput, ElButton } from 'element-plus';
import { gemoji } from 'gemoji';
import type { VueNodeViewProps } from '../plugins/vueNodeViews';
import type { Attrs } from 'prosemirror-model';
import { computed, ref } from 'vue';


const props = defineProps<VueNodeViewProps>()
const emits = defineEmits<{
  updateAttrs: [Attrs]
}>()

const keyword = ref('');
const emojis = computed(() => {
  if (!keyword.value) return gemoji;
  const value = keyword.value;
  return gemoji.filter(item => item.names.some(name => name.includes(value)));
});

const update = (attrs: { icon: string }) => {
  emits('updateAttrs', attrs )
}

const random = () => {
  const index = Math.floor(emojis.value.length * Math.random());
  update({
    icon: emojis.value[index].emoji
  });
};


</script>

<style lang="less" scoped>
.callout-view {
  display: flex;
  padding: 16px 16px 16px 12px;
  background: rgb(241, 241, 239);
  border-radius: 4px;
  align-items: first baseline;
  .callout-icon {
    font-size: 22px;
    cursor: pointer;
    transition: background .2s, transform .2s;
    height: 32px;
    width: 32px;
    line-height: 32px;
    text-align: center;
    border-radius: 4px;
    &:hover {
      background: #dedede;
    }
    &:active {
      transform: scale(1.2);
    }
  }
  .callout-content {
    margin-left: 8px;
    flex: 1;
  }
}
.select-bar {
  display: flex;
}
.emoji-panel {
  width: 300px;
  height: 320px;
  overflow: auto;
  display: grid;
  grid-template-columns: repeat(auto-fill, 32px);
  font-size: 26px;
  align-content: start;
  margin-top: 8px;
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
    text-align: center;
    cursor: pointer;
    border-radius: 4px;
    transition: background .2s, transform .2s;
    content-visibility: auto;
    contain-intrinsic-size: 32px;
    &:hover {
      background: #dedede;
      transform: scale(1.2);
    }
  }
}
</style>