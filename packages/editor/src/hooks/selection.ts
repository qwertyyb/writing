import { createLogger } from '@writing/utils/logger';
import { type Ref, onMounted, onBeforeUnmount, ref, toRaw, nextTick } from 'vue';
import { getSelectionOffset } from '../models/caret';
import { BlockTree, OperateSource } from '../models/BlockTree';
import { BlockModel } from '../models/block';
import * as R from 'ramda';
import { isTextBlock } from './operator';
import Delta from 'quill-delta';
import { focusBlock } from './focus';

const logger = createLogger('selection');

export interface SelectionBlockPosition {
  path: number[],
  offset: number
}

export interface SelectionRange {
  from: SelectionBlockPosition,
  to: SelectionBlockPosition
}

export interface SelectionState {
  range?: SelectionRange | null,
  type: 'Caret' | 'Range',
  rect: {
    top: number, left: number
    width: number, height: number
  } | null
}


const getBlockElFromNode = (node: Node): HTMLElement | null => {
  let blockId = (node as HTMLElement)?.dataset?.blockId;
  if (blockId) return node as HTMLElement;
  blockId = node?.parentElement?.dataset.blockId;
  if (blockId) return node.parentElement as HTMLElement;
  return node?.parentElement?.closest<HTMLElement>('[data-block-id]') ?? null;
};

const getBlockIdFromPoint = (x: number, y: number) => {
  const element = document.elementFromPoint(x, y) as HTMLElement;
  if (element.dataset?.blockId) return element.dataset.blockId;
  const closestBlockEl = element.closest<HTMLElement>('[data-block-id]');
  return closestBlockEl?.dataset!.blockId;
};

const getBlockIdFromNode = (node: Node): string | null => {
  const blockEl = getBlockElFromNode(node);
  return blockEl?.dataset.blockId ?? null;
};

export const getSelectionRange = (range: Range): SelectionRange => {
  const startBlockEl = getBlockElFromNode(range.startContainer);
  const startBlockPath = startBlockEl?.dataset.blockPath?.split(',').map(i => Number(i));
  const startOffset = getSelectionOffset(startBlockEl!, range.startContainer) + range.startOffset;

  const endBlockEl = getBlockElFromNode(range.endContainer);
  const endBlockPath = endBlockEl?.dataset.blockPath?.split(',').map(i => Number(i));
  const endOffset = getSelectionOffset(endBlockEl!, range.endContainer) + range.endOffset;

  logger.i('rangeHandler from', [...startBlockPath], 'to', [...endBlockPath]);
  logger.i('rangeHandler offset', startOffset, endOffset);
  
  return {
    from: {
      path: startBlockPath!,
      offset: startOffset
    },
    to: {
      path: endBlockPath!,
      offset: endOffset
    }
  };
};

const getNodeAndOffset = (position: SelectionBlockPosition) => {
  const { path, offset } = position;
  const element = document.querySelector(`[data-block-path=${JSON.stringify(path.join(','))}]`);
  const iterator = document.createNodeIterator(element, NodeFilter.SHOW_TEXT);

  let nodeOffset = offset;
  while(iterator.nextNode()) {
    const len = iterator.referenceNode.textContent.length;
    if (len >= nodeOffset) {
      return { node: iterator.referenceNode, offset: nodeOffset };
    }
    nodeOffset -= len;
  }
  return { node: iterator.referenceNode, offset: offset ? 1 : 0 };
};

export const setSelectionRange = (selection: SelectionRange) => {
  const { from, to } = selection;
  const { node: startContainer, offset: startOffset } = getNodeAndOffset(from);
  const { node: endContainer, offset: endOffset } = getNodeAndOffset(to);
  window.getSelection()?.setBaseAndExtent(startContainer, startOffset, endContainer, endOffset);
};

export const setCaretPosition = (position: SelectionBlockPosition) => {
  const { node: startContainer, offset: startOffset } = getNodeAndOffset(position);
  window.getSelection()?.setBaseAndExtent(startContainer, startOffset, startContainer, startOffset);
};

export const useSelection = ({ el }: {
  el: Ref<HTMLElement | undefined>
}) => {
  const state = ref<SelectionState>({
    range: null,
    type: 'Caret',
    rect: null
  });

  let isMultiSelect = false;

  let anchorNodeBlockId: string | null = null;
  let anchorNode: Node | null = null;
  let focusNode: Node | null = null;
  let focusOffset = 0;
  let anchorOffset = 0;

  const resetState = () => {
    logger.i('clear');
    state.value.range = null;
    state.value.type = 'Caret';
    state.value.rect = null;
  };

  const enterMultiSelect = () => {
    isMultiSelect = true;
    el.value!.querySelectorAll<HTMLElement>('[contenteditable]')
      .forEach(dom => {
        dom.dataset.originContenteditable = dom.contentEditable;
        dom.removeAttribute('contenteditable');
      });
  };

  const exitMultiSelect = () => {
    isMultiSelect = false;
    el.value!.querySelectorAll<HTMLElement>('[data-origin-contenteditable]')
      .forEach(dom => {
        dom.contentEditable = dom.dataset.originContenteditable as string;
        delete dom.dataset.originContenteditable;
      });
  };

  const clear = () => {
    resetState();
    exitMultiSelect();
  };

  const selectionInEditor = (selection: Selection) => {
    return el.value!.contains(selection.anchorNode) && el.value!.contains(selection.focusNode);
  };

  const rangeHandler = () => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount < 1) return;
    const range = selection.getRangeAt(0);
    logger.i('rangeHandler', range);

    state.value.range = getSelectionRange(range);
    logger.i('rangeHandler selection', { ...toRaw(state.value.range) }, document.activeElement);

    const rect = range.getBoundingClientRect();
    state.value.rect = {
      width: rect.width,
      height: rect.height,
      top: rect.top,
      left: rect.left
    };
  };

  const selectionchangeHandler = () => {
    const selection = window.getSelection();
    logger.i('selectionchangeHandler', selection, selectionInEditor(selection));
    if (!selection || !selectionInEditor(selection) || selection.type === 'None') return clear();

    if (selection.anchorNode) {
      anchorNode = selection.anchorNode;
      anchorOffset = selection.anchorOffset;
      focusNode = selection.focusNode;
      focusOffset = selection.focusOffset;
      anchorNodeBlockId = getBlockIdFromNode(selection.anchorNode);
    } else {
      anchorNode = null;
      anchorOffset = 0;
      focusNode = null;
      focusOffset = 0;
      anchorNodeBlockId = null;
    }

    state.value.rect = null;
    state.value.type = selection.type as 'Caret' | 'Range';

    if (selection.type === 'Caret') {
      exitMultiSelect();
    }
    rangeHandler();
  };

  onMounted(() => {
    document.addEventListener('selectionchange', selectionchangeHandler);
  });

  onBeforeUnmount(() => {
    document.removeEventListener('selectionchange', selectionchangeHandler);
  });

  const pointermoveHandler = (event: PointerEvent) => {
    if (event.buttons === 1 && !isMultiSelect) {
      const curBlockId = getBlockIdFromPoint(event.clientX, event.clientY);
      if (curBlockId !== anchorNodeBlockId) {
        // 鼠标移出了当前的块范围，设置为跨块多选模式
        enterMultiSelect();
        const sel = window.getSelection();
        if (!sel) return;
        if (anchorNode && focusNode) {
          sel.setBaseAndExtent(anchorNode!, anchorOffset, focusNode!, focusOffset);
        }
        logger.i('pointermove', window.getSelection(), anchorNode, focusNode);
        return;
      }
    }
  };
  
  return { state, pointermoveHandler, clear };
};

export const getBlocksInRange = ({ rootValue, range }: { rootValue: BlockTree, range: SelectionRange }) => {
  const { from, to } = range;
  const blocksInRange: { path: number[], block: BlockModel }[] = [];
  rootValue.walkTreeBetween(from.path, to.path, (path, block) => {
    blocksInRange.push({ path, block: { ...block, children: [] } });
  });
  const firstBlock = R.head(blocksInRange);
  const lastBlock = R.last(blocksInRange);
  if (isTextBlock(firstBlock.block)) {
    blocksInRange[0].block = {
      ...firstBlock.block,
      data: {
        ops: new Delta(firstBlock.block.data.ops).slice(from.offset).ops
      }
    };
  }
  if (isTextBlock(lastBlock.block)) {
    blocksInRange[blocksInRange.length - 1].block = {
      ...lastBlock.block,
      data: {
        ops: new Delta(lastBlock.block.data.ops).slice(0, to.offset).ops
      }
    };
  }
  return blocksInRange;
};

export const deleteRange = ({ rootValue, range }: { rootValue: BlockTree, range: SelectionRange }) => {
  const { from, to } = range;
  const blocksInRange: { path: number[], block: BlockModel }[] = [];
  rootValue.walkTreeBetween(from.path, to.path, (path, block) => {
    blocksInRange.push({ path, block });
  });
  const firstBlock = R.head(blocksInRange);
  const lastBlock = R.last(blocksInRange);
  const needRemoveBlocks = R.tail(blocksInRange);
  let firstBlockValue = null;
  let prevPath = firstBlock.path;
  if (!isTextBlock(firstBlock.block) && !isTextBlock(lastBlock.block)) {
    // 第一个选中块非文字块，最后一个也非文字块，则把选中范围内的所有块删除
    needRemoveBlocks.unshift(firstBlock);
    prevPath = rootValue.getPrev(firstBlock.path)?.path ?? null;
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

  const needRetainBlocks: BlockModel[] = [];
  if (needRemoveBlocks.length) {
    // 有块需要删除时，从尾部来看，仅需要删除块本身，不需要删除块的子节点或不在范围的兄弟节点
    // 所以此处查找出所有不需要删除的子节点或不在范围的子节点
    const blockIds = needRemoveBlocks.map(item => item.block.id);
    needRemoveBlocks.forEach(item => {
      BlockTree.walkTree(item.path, rootValue.getByPath(item.path), (childPath, block) => {
        const needLeft = !blockIds.includes(block.id);
        if (needLeft && !needRetainBlocks.includes(block)) {
          needRetainBlocks.push(block);
        }
      });
    });

    // 把待删除的本身节点过滤掉
    const result = BlockTree.filter(rootValue.model, (block) => {
      return !blockIds.includes(block.id);
    });
    rootValue.updateModel(result);
    logger.i('keydownHandler after filter', result);

  }
  rootValue.startTransaction(() => {
    if (firstBlockValue) {
      rootValue.update(
        firstBlock.path,
        firstBlockValue,
        OperateSource.API
      );
    }
    if (needRetainBlocks.length && prevPath) {
      // 把需要保留的节点追加为第一个节点的子节点
      const baseIndex = R.last(firstBlock.path);
      const parentPath = R.init(firstBlock.path);
      needRetainBlocks.forEach((block, index) => {
        rootValue.addAfter([...parentPath, index + baseIndex], block, OperateSource.API);
      });
    }
  }, OperateSource.API);


  nextTick(() => {
    if (!R.equals(prevPath, firstBlock.path)) {
      focusBlock(rootValue.getByPath(prevPath).id, 'end');
    } else {
      setCaretPosition({ path: firstBlock.path, offset: from.offset });
    }
  });
  return prevPath;
};