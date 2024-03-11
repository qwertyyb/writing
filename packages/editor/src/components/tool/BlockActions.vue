<template>
  <div class="block-actions"
    :style="{top: state.top + 'px', left: state.left + 'px'}"
  >
    <el-dropdown trigger="click" @command="commandHandler" @visible-change="popoverChangeHandler">
      <span class="material-symbols-outlined block-actions-icon"
        @mouseover="mouseoverHandler"
        @mouseout="mouseoutHandler"> drag_indicator </span>
      <template #dropdown>
        <el-dropdown-menu>
          <el-dropdown-item command="add.before">
            <div class="command-item">
              <span class="material-symbols-outlined command-icon">add</span>
              在前面添加
            </div>
          </el-dropdown-item>
          <el-dropdown-item command="add.after">
            <div class="command-item">
              <span class="material-symbols-outlined command-icon">add</span>
              在后面添加
            </div>
          </el-dropdown-item>
          <el-dropdown-item divided command="remove">
            <div class="command-item">
              <span class="material-symbols-outlined command-icon">delete</span>
              删除
            </div>
          </el-dropdown-item>
        </el-dropdown-menu>
      </template>
    </el-dropdown>
  </div>
</template>

<script lang="ts" setup>
import { ElDropdown, ElDropdownMenu, ElDropdownItem } from 'element-plus';
import { BlockTree, rootSymbol } from '../../models/BlockTree';
import { ShallowRef, inject, onBeforeUnmount, onMounted, ref } from 'vue';
import * as R from 'ramda';
import { createBlock } from '../../models/block';
import { createLogger } from '@writing/utils/logger';

const HighlightClassName = 'actions-hover-highlight';

const logger = createLogger('BlockActions');

const rootValue = inject<ShallowRef<BlockTree>>(rootSymbol);

const state = ref({
  top: 0, left: 0,
  visible: false,
  blockId: '',
  blockPath: [],
  isActing: false,
});

const unhighlightBlock = () => {
  document.querySelectorAll(`.${HighlightClassName}[data-block-id]`).forEach(dom => dom.classList.remove(HighlightClassName));
};

const highlightBlock = () => {
  const needHighlightBlock = document.querySelector<HTMLElement>(`[data-block-id=${JSON.stringify(state.value.blockId)}]`);
  if (!highlightBlock) return;
  if (needHighlightBlock.classList.contains(HighlightClassName)) {
    return;
  }
  unhighlightBlock();
  needHighlightBlock.classList.add(HighlightClassName);
};

const mouseoverHandler = () => {
  highlightBlock();
};

const mouseoutHandler = () => {
  unhighlightBlock();
};

const commandHandler = (command: string) => {
  logger.i('command', command, [...state.value.blockPath]);
  if (command === 'add.after') {
    rootValue.value.startTransaction(() => {
      rootValue.value.addAfter(state.value.blockPath, createBlock({
        type: 'text',
        data: {
          ops: []
        }
      }));
    });
  } else if (command === 'add.before') {
    const index = R.last(state.value.blockPath);
    const parentPath = R.take(state.value.blockPath.length - 1, state.value.blockPath);
    rootValue.value.startTransaction(() => {
      rootValue.value.addAfter([...parentPath, index - 1], createBlock({
        type: 'text',
        data: {
          ops: []
        }
      }));
    });
  } else if (command === 'remove') {
    rootValue.value.startTransaction(() => {
      rootValue.value.remove(state.value.blockPath);
    });
  }
};

const popoverChangeHandler = (visible: boolean) => {
  state.value.isActing = visible;
};

const hide = () => { state.value.visible = false; };

const pointermoveHandler = (event: PointerEvent) => {
  if (state.value.isActing) return;
  let blockEl = document.elementFromPoint(event.clientX + 18, event.clientY).closest<HTMLElement>('[data-block-id');
  if (!blockEl) {
    blockEl = (event.target as HTMLElement).closest('[data-block-id]');
  }
  if (!blockEl) return hide();
  const blockContentEl = blockEl.querySelector<HTMLDivElement>('.block-content');
  if (!blockContentEl) return hide();
  const blockId = blockEl.dataset.blockId;
  const blockPath = blockEl.dataset.blockPath?.split(',').map(item => Number(item)) ?? [];
  const { left } = blockEl.getBoundingClientRect();
  const { top, height } = blockContentEl.getBoundingClientRect();
  const { top: pTop, left: pLeft } = document.querySelector('.rich-text-editor-wrapper')!.getBoundingClientRect();
  const tTop = top - pTop + (height - 24) / 2;
  const tLeft = left - pLeft - 28;
  state.value = {
    ...state.value,
    top: tTop,
    left: tLeft,
    visible: true,
    blockId,
    blockPath
  };
};

onMounted(() => {
  document.querySelector('.rich-text-editor-wrapper')?.addEventListener('pointermove', pointermoveHandler, { passive: true });
});

onBeforeUnmount(() => {
  document.querySelector('.rich-text-editor-wrapper')?.removeEventListener('pointermove', pointermoveHandler);
});

</script>

<style lang="less" scoped>
.block-actions {
  width: 24px;
  height: 24px;
  opacity: 0.8;
  z-index: 1;
  position: absolute;
}
.block-actions-icon {
  font-size: 24px;
  cursor: pointer;
  user-select: none;
  color: rgb(190, 190, 190);
  font-weight: 300;
  border-radius: 4px;
  transition: background .2s;
  &:hover {
    background: rgba(230, 230, 230);
  }
}
.command-item {
  display: flex;
  align-items: center;
  .command-icon {
    font-size: 20px;
    margin-right: 6px;
  }
}
</style>