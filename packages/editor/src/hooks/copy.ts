import { createLogger } from '@writing/utils/logger';
import { Ref, ShallowRef, onBeforeUnmount, onMounted } from 'vue';
import { deleteRange, getBlocksInRange, type SelectionState } from './selection';
import { createBlockId, type BlockModel, createBlock } from '../models/block';
import { BlockTree } from '../models/BlockTree';
import { getImageRatio } from '../components/blocks/image/utils';
import Delta from 'quill-delta';

const logger = createLogger('copy');

type BlockWithPath = { path: number[], block: BlockModel }

export const useCopy = ({ rootValue, selectionState, upload }: { rootValue: ShallowRef<BlockTree>, selectionState: Ref<SelectionState>, upload: (file: Blob | File) => Promise<string> }) => {
  const writeToClipboard = (clipboardData: DataTransfer, action: 'copy' | 'cut' = 'copy') => {
    const div = document.createElement('div');
    div.style.cssText = 'width:0;height:0;overflow:hidden';
    div.appendChild(window.getSelection().getRangeAt(0).cloneContents());
    // 需要把节点先插入到页面中，才能使用 innerText 获取到正常带换行的内容
    document.body.appendChild(div);
    try {
      clipboardData.setData('text/html', div.innerHTML);
      clipboardData.setData('text/plain', div.innerText);
      const blocks = getBlocksInRange({ rootValue: rootValue.value, range: selectionState.value.range });
      clipboardData.setData('text/_writing-copy-data', JSON.stringify({ action, blocks }));
      document.body.removeChild(div);
    } catch (err) {
      document.body.removeChild(div);
      throw err;
    }
  };

  const copyHandler = (event: ClipboardEvent) => {
    logger.i('copyHandler', event);
    writeToClipboard(event.clipboardData);
    event.preventDefault();
  };

  const cutHandler = (event: ClipboardEvent) => {
    writeToClipboard(event.clipboardData, 'cut');
    event.preventDefault();
    deleteRange({ rootValue: rootValue.value, range: selectionState.value.range });
  };

  const pasteBlocks = (blocks: BlockWithPath[]) => {
    // 如果当前文档中已经有相同的 ID，则重新生成 ID
    const ids = blocks.map(item => item.block.id);
    rootValue.value.walkTree((path, block) => {
      const index = ids.indexOf(block.id);
      if (index > -1) {
        blocks[index].block.id = createBlockId();
      }
    });

    const { range, type } = selectionState.value;
    logger.i('pasteHandler', range.from);
    let curPath = range.from.path;
    // 如果是一个 Range,则先删除 Range 内的节点，再把节点添加进去
    if (type === 'Range') {
      curPath = deleteRange({ rootValue: rootValue.value, range });
    }
    logger.i('pasteHandler, paste after', curPath);
    if (!curPath) return;
    // 粘贴内容的最大层级
    const maxLevel = Math.max(...blocks.map(item => item.path.length));
    // 用粘贴内容的第一个节点的层级对齐当前编辑位置的层级，生成在添加节点时需要使用的位置数组
    const baseLevel = blocks[0].path.length;
    const indexArr = curPath.concat(new Array(maxLevel - baseLevel).fill(-1));
    rootValue.value.startTransaction(() => {
      blocks.forEach(item => {
        // 计算当前要添加的节点的最终层级
        const curLevel = Math.max(item.path.length - baseLevel + curPath.length - 1, 0);
        // 之后添加的节点都作为此节点的子节点，所以需要把大于此层级的位置归 0
        for(let i = curLevel + 1; i < indexArr.length; i += 1) {
          indexArr[i] = -1;
        }
        const targetPath = indexArr.slice(0, curLevel + 1);
        rootValue.value.addAfter(
          targetPath,
          { ...item.block, children: [] }
        );
        indexArr[curLevel] += 1;
      });
    });
  };

  const parseFiles = async (files: FileList) => {
    const blocks: BlockWithPath[] = [];
    for(let i = 0; i < files.length; i += 1) {
      const file = files.item(i);
      if (!file.type.startsWith('image/')) continue;
      const url = await upload(file);
      const data = await getImageRatio(url);
      blocks.push({
        path: [0, i],
        block: createBlock({
          type: 'image',
          data
        })
      });
    }
    return blocks;
  };

  const pasteHandler = async (event: ClipboardEvent) => {
    logger.i('pasteHandler', event, event.clipboardData.getData('text/_writing-copy-data'));
    if (!selectionState.value.range.from.path) return;
    let blocks: BlockWithPath[] = [];
    const files = event.clipboardData.files;
    const dataFromSelf = event.clipboardData.getData('text/_writing-copy-data');
    if (files.length) {
      blocks = await parseFiles(files);
    } else if (dataFromSelf) {
      // 粘贴的数据来自 writing 复制的内容
      blocks = JSON.parse(dataFromSelf).blocks;
    } else {
      const plainText = event.clipboardData?.getData('text/plain') ?? '';
      if (!plainText) return;
      blocks = [{
        path: [0, 0],
        block: createBlock({
          type: 'text',
          data: {
            ops: new Delta().insert(plainText).ops
          }
        })
      }];
    }
    if (blocks.length) {
      pasteBlocks(blocks);
    }
  };

  onMounted(() => {
    document.addEventListener('copy', copyHandler);
    document.addEventListener('paste', pasteHandler);
    document.addEventListener('cut', cutHandler);
  });

  onBeforeUnmount(() => {
    document.removeEventListener('copy', copyHandler);
    document.removeEventListener('paste', pasteHandler);
    document.removeEventListener('cut', cutHandler);
  });
};