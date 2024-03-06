<template>
  <div class="todo-block" ref="el">
    <div v-for="(child, index) in block.children"
      :key="child.id + child.type"
      :data-block-id="child.id"
      class="todo-item">
      <input type="checkbox"
        :checked="data.checked[child.id]"
        @change="toggleChecked(child)">
      <block-editor
        class="todo-item-content"
        :model-value="child"
        :index="index"
        :parent="parent"
        :path="[...path, index]"
        @update:modelValue="updateBlock(index, $event)"
        @add="addBlock(index, $event)"
        @remove="removeHandler(child, index)"
      ></block-editor>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { type BlockModel } from '../../../models/block';
import BlockEditor from '../../BlockEditor.vue';
import { watch, ref } from 'vue';
import { useOperator } from '../../../hooks/operator';

const block = defineModel<BlockModel>({ required: true })

const props = defineProps<{
  index: number,
  parent?: BlockModel,
  path: number[],
}>()

const emits = defineEmits<{
  added: [{ block: BlockModel, index: number, parent?: BlockModel }],
  updated: [{ oldBlock: BlockModel, block: BlockModel, index: number, parent?: BlockModel }],
  removed: [{ removed: BlockModel, index: number, parent?: BlockModel }],
  change: [BlockModel],
  'update:modelValue': [BlockModel],
  remove: [],
}>()

const data = ref<{ checked: Record<string, boolean> }>({
  checked: block.value.data?.checked ?? {}
})

const { addBlock, updateBlock, removeBlock } = useOperator(props)

const removeHandler = (child: BlockModel, index: number) => {
  delete data.value.checked[child.id]
  removeBlock(index)
}

const toggleChecked = (child: BlockModel) => {
  data.value.checked[child.id] = !data.value.checked[child.id]
  block.value = {
    ...block.value,
    data: data.value,
  }
}

if (!block.value.children?.length) {
  addBlock(0, {
    type: 'text',
    id: Math.random().toString(16).substring(2)
  })
}

watch(() => block.value.children?.length ?? 0, (newVal, oldVal) => {
  if (oldVal && !newVal) {
    // 所有的子节点已删除，把当前节点也删除
    emits('remove')
  }
})

</script>

<style lang="less" scoped>
.todo-item {
  display: flex;
  align-items: first baseline;
  & > .todo-item-content {
    margin-left: 12px;
    flex: 1;
    cursor: text;
  }
}
</style>@/models/block-operate