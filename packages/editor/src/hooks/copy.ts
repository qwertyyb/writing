import { createLogger } from '@writing/utils/logger';
import { Ref, ShallowRef, onBeforeUnmount, onMounted } from 'vue';
import * as R from 'ramda';
import type { SelectionState } from './selection';
import { createBlockId, type BlockModel } from '../models/block';
import { BlockTree } from '../models/BlockTree';

const logger = createLogger('copy');

type BlockWithPath = { path: number[], block: BlockModel }

const getSelectedBlocks = (rootValue: BlockTree, selectionState: SelectionState) => {
  const { from, to } = selectionState.range;
  const blocksInRange: BlockWithPath[] = [];
  rootValue.walkTreeBetween(from.path, to.path, (path, block) => {
    blocksInRange.push({ path, block });
  });
  // @todo 处理文字节点从中间断开的情况
  return blocksInRange;
};

export const useCopy = ({ rootValue, selectionState }: { rootValue: ShallowRef<BlockTree>, selectionState: Ref<SelectionState> }) => {
  const copyHandler = (event: ClipboardEvent) => {
    logger.i('copyHandler', event);
    const div = document.createElement('div');
    div.style.cssText = 'width:0;height:0;overflow:hidden';
    div.appendChild(window.getSelection().getRangeAt(0).cloneContents());
    // 需要把节点先插入到页面中，才能使用 innerText 获取到正常带换行的内容
    document.body.appendChild(div);
    try {
      event.clipboardData.setData('text/html', div.innerHTML);
      event.clipboardData.setData('text/plain', div.innerText);
      const blocks = getSelectedBlocks(rootValue.value, selectionState.value);
      event.clipboardData.setData('text/_writing-copy-data', JSON.stringify({ action: 'copy', blocks }));
      event.preventDefault();
      document.body.removeChild(div);
    } catch (err) {
      document.body.removeChild(div);
    }
  };

  const pasteHandler = (event: ClipboardEvent) => {
    logger.i('pasteHandler', event, event.clipboardData.getData('text/_writing-copy-data'));
    const dataFromSelf = event.clipboardData.getData('text/_writing-copy-data');
    if (dataFromSelf) {
      const { action, blocks } = JSON.parse(dataFromSelf) as { action: 'cut' | 'copy', blocks: BlockWithPath[] };
      if (action === 'copy') {
        // 复制的时候，需要重新生成 ID，以防止 ID 重复
        blocks.forEach(block => {
          block.block.id = createBlockId();
        });
      }
      const { range, type } = selectionState.value;
      logger.i('pasteHandler', range.from);
      // @todo 如果是一个 Range,则先删除 Range 内的节点，再把节点添加进去
      if (type === 'Caret' && range.from) {
        const { path: curPath } = range.from;
        const levels = blocks.map(item => item.path.length);
        const maxLevel = Math.max(...levels);
        const minLevel = Math.min(...levels);
        rootValue.value.startTransaction(() => {
          // 把第一个节点作为当前节点的下一个兄弟节点，从而推导其它节点所在的位置
          // 如果某个节点所在的等级无法容纳，比如当前节点层级为 3，但是计算出的目录节点层级是 -1，就向上取 0。
          const indexArr = new Array(maxLevel).fill(0);
          const parentPath = R.init(curPath);
          const curIndex = R.last(curPath);
          const baseLevel = curPath.length;
          blocks.forEach(item => {
            const level = Math.max(0, item.path.length - baseLevel);
            for(let i = level + 1; i < indexArr.length; i += 1) {
              indexArr[i] = 0;
            }
            const targetPath = [
              ...parentPath,
              curIndex + indexArr[0],
              ...R.tail(indexArr)
            ];
            rootValue.value.addAfter(
              [
                ...parentPath,
                curIndex + indexArr[0],
                ...R.tail(indexArr)
              ],
              { ...item.block, children: [] }
            );
            indexArr[level] += 1;
          });
        });
      }
    }
  };

  onMounted(() => {
    document.addEventListener('copy', copyHandler);
    document.addEventListener('paste', pasteHandler);
  });

  onBeforeUnmount(() => {
    document.removeEventListener('copy', copyHandler);
    document.removeEventListener('paste', pasteHandler);
  });
};