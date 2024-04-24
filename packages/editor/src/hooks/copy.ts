import { createLogger } from '@writing/utils/logger';
import { Ref, ShallowRef, onBeforeUnmount, onMounted } from 'vue';
import type { SelectionState } from './selection';
import { createBlockId, type BlockModel } from '../models/block';
import { BlockTree } from '../models/BlockTree';

const logger = createLogger('copy');

const getSelectedBlocks = (rootValue: BlockTree, selectionState: SelectionState) => {
  const { from, to } = selectionState.range;
  const blocksInRange: BlockModel[] = [];
  rootValue.walkTreeBetween(from.path, to.path, (path, block) => {
    blocksInRange.push(block);
  });
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
      event.clipboardData.setData('text/_writing-data', JSON.stringify({ action: 'copy', blocks }));
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
      const { action, blocks } = JSON.parse(dataFromSelf) as { action: 'cut' | 'copy', blocks: BlockModel[] };
      if (action === 'copy') {
        // 复制的时候，需要重新生成 ID，以防止 ID 重复
        blocks.forEach(block => {
          block.id = createBlockId();
        });
      }
      // @todo 获取当前位置，把内容插入到当前位置
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