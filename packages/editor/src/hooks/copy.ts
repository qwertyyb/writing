import { createLogger } from '@writing/utils/logger';
import { Ref, ShallowRef, onBeforeUnmount, onMounted } from 'vue';
import type { SelectionState } from './selection';
import type { BlockModel } from '../models/block';
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
      event.clipboardData.setData('text/_writing-copy-data', JSON.stringify(getSelectedBlocks(rootValue.value, selectionState.value)));
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
      // @todo 把数据解析出来，判断 ID 是否要重新生成，然后插入到当前位置
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