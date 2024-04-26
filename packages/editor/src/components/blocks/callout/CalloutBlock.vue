<template>
  <div class="callout-block">
    <el-popover trigger="click" width="auto">
      <template #reference>
        <div class="callout-icon">{{ data.icon }}</div>
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
    <div class="callout-content">
      <text-block
        :model-value="data.text"
        :index="0"
        @add="$emit('add', $event)"
        @update:modelValue="update({ 'text': $event })"
      ></text-block>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue';
import { type BlockModel, createBlock } from '../../../models/block';
import { TextData } from '../../schema';
import TextBlock from '../TextBlock.vue';
import { ElPopover, ElInput } from 'element-plus';
import { gemoji } from 'gemoji';

defineEmits<{
  remove: [],
  add: [options?: Partial<BlockModel>]
}>();

interface CalloutData {
  text: BlockModel<TextData>
  icon: string
}

const block = defineModel<BlockModel<CalloutData>>({ required: true });

const data = ref<CalloutData>({
  text: block.value.data?.text ?? createBlock({ type: 'text', data: { ops: [] } }),
  icon: block.value.data?.icon ?? '💡'
});

const keyword = ref('');
const emojis = computed(() => {
  if (!keyword.value) return gemoji;
  const value = keyword.value;
  return gemoji.filter(item => item.names.some(name => name.includes(value)));
});

const update = (newData: Partial<CalloutData>) => {
  data.value = {
    ...data.value,
    ...newData
  };
  block.value = {
    ...block.value,
    data: data.value
  };
};

const random = () => {
  const index = Math.floor(emojis.value.length * Math.random());
  update({
    icon: emojis.value[index].emoji
  });
};

</script>

<style lang="less" scoped>
.callout-block {
  display: flex;
  padding: 16px 16px 16px 12px;
  background: rgb(241, 241, 239);
  border-radius: 4px;
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