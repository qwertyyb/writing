<template>
  <div class="text-block">
    <text-editor :modelValue="data.ops"
      :readonly="readonly"
      :spellcheck="spellcheck"
      trigger="Slash"
      @update:modelValue="updateModelValue"
      @keyEnter="enterKeyHandler"
      @keyEsc="closeSelector"
      @keyTab="$emit('moveLower')"
      @keyShiftTab="$emit('moveUpper')"
      @backspace="backspaceKeyHandler"
      @keyTrigger="openSelector"
      @upload="uploadHandler"
      @keydown="keydownHandler"
      @change="textChangeHandler"
      ref="textEditorEl"
    ></text-editor>

    <teleport to=".rich-text-editor" v-if="selectorState.visible">
      <block-selector
        v-click-outside="closeSelector"
        ref="selector"
        @confirm="onCommand"
        @close="closeSelector"
        :keyword="selectorState.keyword"
        :rect="selectorState.rect"
      ></block-selector>
    </teleport>
  </div>
</template>

<script lang="ts" setup>
import { ref, watch, inject } from 'vue';
import { ClickOutside as vClickOutside } from 'element-plus';
import BlockSelector from '../tool/BlockSelector.vue';
import TextEditor from '@writing/inline-editor';
import { createBlock, type BlockModel } from '../../models/block';
import { useMode } from '../../hooks/mode';
import { useSpellcheck } from '../../hooks/spellcheck';
import { transformBlock } from '../../hooks/transform';
import { createLogger } from '@writing/utils/logger';
import { getImageRatio } from './image/utils';
import { isEmpty, split, toText } from '@writing/utils/delta';
import type { TextData } from '../schema';
import { uploadSymbol } from '../../utils/upload';
import { useBlockSelectorState } from '../../hooks/blockSelector';
import Quill from 'quill';
import Delta from 'quill-delta';

const logger = createLogger('TextBlock');

const block = defineModel<BlockModel<TextData>>({ required: true });

const props = defineProps<{
  path?: number[],
}>();

const emits = defineEmits<{
  add: [options?: Partial<BlockModel>],
  update: [options: Partial<BlockModel>]
  remove: [],
  move: [newPath: number[]],
  moveUpper: [],
  moveLower: [],
  merge: [],
}>();

const { readonly } = useMode();
const spellcheck = useSpellcheck();
const uploader = inject<(file: Blob | File) => Promise<string>>(uploadSymbol);

const data = ref<TextData>({ ...block.value.data, ops: block.value.data?.ops ?? [] });

const updateModelValue = (ops: any[]) => {
  block.value = { ...block.value, data: { ops } };
  data.value = { ops };
};
watch(block, () => {
  if (JSON.stringify(data.value.ops) !== JSON.stringify(block.value?.data?.ops)) {
    data.value.ops = block.value.data?.ops ?? [];
  }
});

const textEditorEl = ref<InstanceType<typeof TextEditor>>();

const { state: selectorState, selector, open: openSelector, close: closeSelector, setKeyword: setSelectorKeyword } = useBlockSelectorState();

const onCommand = (command: any) => {
  logger.i('onCommand', command, );
  block.value = {
    ...block.value, type: command.identifier,
    data: {
      ops: new Delta(block.value.data.ops)
        .compose(new Delta().retain(selectorState.value.keywordOffset - 1).delete(selectorState.value.keyword.length + 1))
        .ops as any
    }
  };
  selectorState.value.visible = false;
};

const enterKeyHandler = async (offset: number) => {
  if (selectorState.value.visible) {
    const selected = selector.value.selected();
    logger.i('visible', selected);
    if (selected) {
      return onCommand(selected);
    }
  }
  if (isEmpty(data.value.ops)) {
    // 没有输入字符时，回车，往上级移动
    const handled = moveUpper();
    if (handled) return;
  }
  // 把当前内容截断
  const { before, after } = split(data.value.ops, offset);
  updateModelValue(before as any);
  logger.i('add text node', after);
  emits('add', {
    type: 'text',
    data: {
      ops: after
    }
  });
};

const moveUpper = () => {
  if (!props.path || props.path.length <= 1) return false;
  emits('moveUpper');
  return true;
};

const backspaceKeyHandler = (offset: number) => {
  if (!isEmpty(data.value.ops) && offset === 0) {
    if (!moveUpper()) {
      // 无法向上级移动了，需要和上一个合并？
      emits('merge');
    }
    return;
  } else if (isEmpty(data.value.ops)) {
    // 前面没有字符可删除时，删除此block, 把光标移动到上一个block
    emits('remove');
  }
};

const textChangeHandler = (editor: Quill) => {
  if (!selectorState.value.visible) return;
  const { index } = editor.getSelection();
  if (index < selectorState.value.keywordOffset) {
    return closeSelector();
  }
  const text = editor.getText(selectorState.value.keywordOffset, index - selectorState.value.keywordOffset);
  setSelectorKeyword(text);
};

const keydownHandler = (event: KeyboardEvent, offset: number) => {
  if (selectorState.value.visible) {
    if (event.code === 'ArrowUp') {
      event.preventDefault();
      selector.value.selectPrev();
    } else if (event.code === 'ArrowDown') {
      event.preventDefault();
      selector.value.selectNext();
    }
  }
  if (event.code !== 'Space') return;
  const { before, after: content } = split(data.value.ops, offset);
  const trigger = toText(before);
  logger.i('keydownHandler', trigger, JSON.parse(JSON.stringify(content)));
  const newBlock = transformBlock(trigger, block.value, content);
  if (newBlock) {
    event.preventDefault();
    block.value = newBlock as any;
  }
};

const uploadHandler = async (file: File) => {
  const isImage = file.type.startsWith('image/');
  if (!isImage) {
    return logger.i('暂不支持的文件类型', file);
  }
  const url = await uploader(file);
  const data = await getImageRatio(url);
  emits('add', createBlock({
    type: 'image',
    data
  }));
};
</script>

<style lang="less" scoped>
</style>