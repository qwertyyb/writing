<template>
  <div class="rich-text-editor" ref="el">
    <block-actions v-if="mode === Mode.Edit"></block-actions>
    <editor-toolbar
      v-if="mode === Mode.Edit"
      :root="model"
      :selection="selectionState"></editor-toolbar>
    <div class="rich-text-editor-wrapper"
      ref="editorEl"
      @keydown.capture="keydownHandler"
      tabindex="0"
      :contenteditable="mode === Mode.Readonly ? undefined : 'plaintext-only'">
      <block-editor :model-value="model"
        :index="0"
        :path="[]"
        :key="model.id"
        @update:model-value="rootValue.updateModel($event)"
        @pointermove="pointermoveHandler"></block-editor>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { createBlock, type BlockModel } from '../models/block';
import BlockEditor from './BlockEditor.vue';
import { focusBlock } from '../hooks/focus';
import { provide, type PropType, computed, ref, shallowRef, watch, onMounted, onBeforeUnmount, nextTick } from 'vue';
import { Mode } from './schema';
import { useHistory } from '../hooks/history';
import { setCaretPosition, useSelection } from '../hooks/selection';
import EditorToolbar from './tool/EditorToolbar.vue';
import { createLogger } from '@writing/utils/logger';
import { BlockTree, OperateSource, rootSymbol } from '../models/BlockTree';
import { uploadSymbol } from '../utils/upload';
import { JSONPatch } from '@writing/utils/patch';
import * as R from 'ramda';
import Delta from 'quill-delta';
import { isTextBlock } from '../hooks/operator';
import BlockActions from './tool/BlockActions.vue';

const logger = createLogger('RichTextEditor');

const model = defineModel<ReturnType<typeof createBlock>>({
  required: true
});
const props = defineProps({
  mode: {
    type: String as PropType<Mode>,
    default: Mode.Edit
  },
  spellcheck: {
    type: Boolean,
    default: false
  },
  upload: {
    type: Function as PropType<(file: Blob | File) => Promise<string>>
  }
});

defineEmits<{
  'update:modelValue': [BlockModel]
}>();

const el = ref<HTMLElement>();
const editorEl = ref<HTMLDivElement>();
const rootValue = shallowRef(new BlockTree(model.value));

const mode = computed(() => props.mode);
const spellcheck = computed(() => props.spellcheck);

provide('mode', mode);
provide('spellcheck', spellcheck);
provide(uploadSymbol, props.upload);
provide(rootSymbol, rootValue);

const { state: selectionState, pointermoveHandler: selectionTrigger, clear: clearSelection } = useSelection({ el: editorEl });

const { undo, redo, pushLatest } = useHistory(el, model);

const changeHandler = (value: BlockModel, changes: JSONPatch[]) => {
  logger.i('change', value, changes);
  model.value = value;
  pushLatest();
};
const addedHandler = ({ block }: { block: BlockModel }, source) => {
  if (source === OperateSource.User) {
    focusBlock(block.id, 'start');
  }
};
const updatedHandler = ({ oldBlock, block }: { oldBlock: BlockModel, block: BlockModel }, source) => {
  if (source !== OperateSource.User) return;
  if (oldBlock.type + oldBlock.id !== block.type + block.id) {
    focusBlock(block.id);
  }
};
const removedHandler = ({ path }: { path: number[] }) => {
  const prev = rootValue.value.getPrev(path);
  if (prev) {
    focusBlock(prev.block.id);
  }
};

onMounted(() => {
  if (props.mode === Mode.Edit) {
    rootValue.value.on('change', changeHandler);

    rootValue.value.on('added', addedHandler);
    rootValue.value.on('updated', updatedHandler);
    rootValue.value.on('removed', removedHandler);
  }
});

onBeforeUnmount(() => {
  rootValue.value.off('change', changeHandler);

  rootValue.value.off('added', addedHandler);
  rootValue.value.off('updated', updatedHandler);
  rootValue.value.off('removed', removedHandler);
});

watch(model, (value) => {
  rootValue.value.updateModel(value);
});

const pointermoveHandler = (event: PointerEvent) => {
  if (props.mode === Mode.Readonly) return;
  selectionTrigger(event);
};

const multiSelectDeleteHandler = () => {
  const { from, to } = selectionState.value.range;
  const blocksInRange: { path: number[], block: BlockModel }[] = [];
  rootValue.value.walkTreeBetween(from.path, to.path, (path, block) => {
    blocksInRange.push({ path, block });
  });
  const firstBlock = R.head(blocksInRange);
  const lastBlock = R.last(blocksInRange);
  const needRemoveBlocks = R.takeLast(R.length(blocksInRange) - 1, blocksInRange);
  let firstBlockValue = null;
  let prevPath = firstBlock.path;
  if (!isTextBlock(firstBlock.block) && !isTextBlock(lastBlock.block)) {
    // 第一个选中块非文字块，最后一个也非文字块，则把选中范围内的所有块删除
    needRemoveBlocks.unshift(firstBlock);
    prevPath = rootValue.value.getPrev(firstBlock.path)?.path ?? null;
  } else if (!isTextBlock(firstBlock.block) && isTextBlock(lastBlock.block)) {
    // 第一个选中块非文字块，最后一个块为文字块，则更新最后一个块为选中范围之后的文字
    firstBlockValue = {
      id: firstBlock.block.id,
      type: lastBlock.block.type,
      data: {
        ops: new Delta(lastBlock.block.data.ops).slice(to.offset).ops
      }
    };
  } else if (isTextBlock(firstBlock.block) && isTextBlock(lastBlock.block)) {
    // 第一个选中块为文字块，并且最后一个也是文字块
    // 把第一个选中块选中范围之前的文字和最后一个选中块选中范围之后的文字拼接
    const firstBeforeText = new Delta(firstBlock.block.data.ops).slice(0, from.offset);
    const lastAfterText = new Delta(lastBlock.block.data.ops).slice(to.offset);
    firstBlockValue = {
      data: {
        ops: firstBeforeText.compose(new Delta().retain(from.offset).concat(lastAfterText)).ops
      }
    };
  } else if (isTextBlock(firstBlock.block) && !isTextBlock(lastBlock.block)) {
    // 第一个选中块为文字块，最后一个块非文字块
    // 保留第一个块选中范围之前的文字
    firstBlockValue = {
      data: {
        ops: new Delta(firstBlock.block.data.ops).slice(0, from.offset).ops
      }
    };
  }

  const leftBlocks: BlockModel[] = [];
  if (needRemoveBlocks.length) {
    const blockIds = needRemoveBlocks.map(item => item.block.id);
    needRemoveBlocks.forEach(item => {
      BlockTree.walkTree(item.path, rootValue.value.getByPath(item.path), (childPath, block) => {
        const needLeft = !blockIds.includes(block.id);
        if (needLeft && leftBlocks.indexOf(block) === -1) {
          leftBlocks.push(block);
        }
      });
    });

    // 把选中的组件删除
    const result = BlockTree.filter(rootValue.value.model, (block) => {
      return !blockIds.includes(block.id);
    });
    rootValue.value.updateModel(result);
    logger.i('keydownHandler after filter', result);

  }
  rootValue.value.startTransaction(() => {
    if (firstBlockValue) {
      rootValue.value.update(
        firstBlock.path,
        firstBlockValue,
        OperateSource.API
      );
    }
    if (leftBlocks.length && prevPath) {
      const baseIndex = R.last(firstBlock.path);
      const parentPath = R.take(firstBlock.path.length - 1, firstBlock.path);
      leftBlocks.forEach((block, index) => {
        rootValue.value.addAfter([...parentPath, index + baseIndex], block, OperateSource.API);
      });
    }
  }, OperateSource.API);

  clearSelection();
  nextTick(() => {
    if (!R.equals(prevPath, firstBlock.path)) {
      focusBlock(rootValue.value.getByPath(prevPath).id, 'end');
    } else {
      setCaretPosition({ path: firstBlock.path, offset: from.offset });
    }
  });
};

const keydownHandler = (event: KeyboardEvent) => {
  if (props.mode === Mode.Readonly) return;
  // 仅用来处理多选和历史
  // const selection = getSelectionPosition(el.value!)
  // resetContenteditable()
  // selection && setSelectionPosition(el.value!, selection)
  // 处理历史 undo/redo
  if (event.metaKey && event.key === 'z' && event.shiftKey) {
    event.preventDefault();
    event.stopImmediatePropagation();
    event.stopPropagation();
    redo();
  } else if (event.metaKey && event.key === 'z') {
    event.preventDefault();
    event.stopImmediatePropagation();
    event.stopPropagation();
    undo();
  }

  if (!selectionState.value.range) return;
  const { from, to } = selectionState.value.range;
  if (R.equals(from.path, to.path)) return;

  if (event.code === 'Backspace') {
    event.preventDefault();
    event.stopImmediatePropagation();
    event.stopPropagation();

    multiSelectDeleteHandler();
  }
};
</script>

<style lang="less" scoped>
.rich-text-editor {
  min-width: 50vw;
  min-height: 50vh;
  position: relative;
  .rich-text-editor-wrapper {
    border: none;
    outline: none;
    padding-bottom: 40vh;
    user-select: text;

    &:deep([data-block-id]) {
      transition: background .3s;
      &.actions-hover-highlight {
        background: rgba(58, 142, 137, 0.2);
        border-radius: 4px;
      }
    }
  }
}
</style>