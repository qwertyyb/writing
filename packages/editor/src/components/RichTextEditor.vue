<template>
  <div class="rich-text-editor" ref="el">
    <block-actions
      @move="moveBlockHandler"
      v-if="mode === Mode.Edit"></block-actions>
    <editor-toolbar
      v-if="mode === Mode.Edit"
      :root="model"
      :selection="selectionState"></editor-toolbar>
    <div class="rich-text-editor-wrapper"
      ref="editorEl"
      @keydown.capture="keydownHandler"
      tabindex="0"
      :contenteditable="mode === Mode.Readonly ? undefined : 'true'">
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
import { provide, type PropType, computed, ref, shallowRef, watch, onMounted, onBeforeUnmount } from 'vue';
import { Mode } from './schema';
import { useHistory } from '../hooks/history';
import { deleteRange, useSelection } from '../hooks/selection';
import EditorToolbar from './tool/EditorToolbar.vue';
import { createLogger } from '@writing/utils/logger';
import { BlockTree, OperateSource, rootSymbol } from '../models/BlockTree';
import { uploadSymbol } from '../utils/upload';
import { JSONPatch } from '@writing/utils/patch';
import * as R from 'ramda';
import { useCopy } from '../hooks/copy';
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

useCopy({ rootValue, selectionState, upload: props.upload });

const { undo, redo, pushLatest } = useHistory(el, model);

const changeHandler = (value: BlockModel, changes: JSONPatch[]) => {
  logger.i('change', value, changes);
  model.value = value;
  pushLatest();
};
const addedHandler = ({ block }: { block: BlockModel }, source: OperateSource) => {
  if (source === OperateSource.User) {
    focusBlock(block.id, 'start');
  }
};
const updatedHandler = ({ oldBlock, block }: { oldBlock: BlockModel, block: BlockModel }, source: OperateSource) => {
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
const moveBlockHandler = (params: { sourcePath: number[], targetPath: number[], position: 'before' | 'after' | 'inside' }) => {
  const { sourcePath, targetPath, position } = params;
  // 移动的原理是删除原位置的节点，把删除的节点插入到新的位置上
  // 由于删除节点后，原插入节点的位置可能会变化，所以此处需要校正一下
  let toPath = [...targetPath];
  if (R.startsWith(R.init(sourcePath), targetPath) && R.last(sourcePath) < R.nth(sourcePath.length - 1, targetPath)) {
    toPath = R.adjust(sourcePath.length - 1, R.dec, targetPath);
  }
  rootValue.value.startTransaction(() => {
    const removed = rootValue.value.remove(sourcePath);
    let path = toPath;
    if (position === 'before') {
      const index = R.last(targetPath);
      path = [...R.init(targetPath), index - 1];
    } else if (position === 'inside') {
      const target = rootValue.value.getByPath(targetPath);
      const index = target.children.length - 1;
      path = [...targetPath, index];
    }
    rootValue.value.addAfter(path, removed);
  });
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
  deleteRange({ rootValue: rootValue.value, range: selectionState.value.range });

  clearSelection();
};

const keydownHandler = (event: KeyboardEvent) => {
  if (props.mode === Mode.Readonly) return;
  logger.i('keydownHandler', event);
  // 仅用来处理多选和历史
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
  } else if (event.metaKey && event.key === 'c' || event.metaKey && event.key === 'x' || event.metaKey && event.key === 'v') {
    return;
  }

  if (!selectionState.value.range) return;
  const { from, to } = selectionState.value.range;
  if (R.equals(from.path, to.path)) return;

  event.preventDefault();
  event.stopImmediatePropagation();
  event.stopPropagation();
  if (event.code === 'Backspace') {
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
    &:deep([data-block-path]) {
      &.movable-source {
        opacity: 0.4;
        cursor: move;
      }
      .block-content {
        position: relative;
        &.movable-selected {
          transition: background .3s;
          &::before, &::after {
            content: " ";
            position: absolute;
            left: 0;
            width: 100%;
            height: 3px;
            background-color: rgb(227, 219, 5);
            display: none;
          }
          &::before {
            top: -1.5px;
          }
          &::after {
            bottom: -1.5px;
          }
          &.movable-insert-before::before {
            display: block;
          }
          &.movable-insert-after::after {
            display: block;
          }
          &.movable-insert-children {
            background: rgb(227, 219, 5);
          }
        }
      }
    }
  }
}
</style>