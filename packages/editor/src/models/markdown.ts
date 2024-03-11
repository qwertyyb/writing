import { BlockTree } from './BlockTree';
import { BlockModel } from './block';
import { deltaToMarkdown } from 'quill-delta-to-markdown';
import * as R from 'ramda';

// 先简单处理，忽略 列表、todo、block-quote 的深层嵌套逻辑
export const toMarkdown = (root: BlockModel) => {
  const rows: string[] = [];
  let ignorePath: number[] | null = null;
  BlockTree.walkTree([], root, (path, block) => {
    if (ignorePath && R.startsWith(ignorePath, path)) { return; }
    ignorePath = null;
    const { type, data, children } = block;
    let row = '';
    switch (type) {
    case 'text':
      row = deltaToMarkdown(data.ops);
      break;
    case 'image':
      row = `![${deltaToMarkdown(data.title?.data?.ops || [])}](${data.src})`;
      break;
    case 'unordered-list':
      ignorePath = path;
      row = children.map(item => {
        return `- ${deltaToMarkdown(item.data?.ops || [])}`;
      }).join('\n');
      break;
    case 'ordered-list':
      row = children.map((item, index) => {
        return `${index+1}. ${deltaToMarkdown(item.data?.ops || [])}`;
      }).join('\n');
      ignorePath = path;
      break;
    case 'heading1':
      row = `# ${deltaToMarkdown(data.ops || [])}`;
      break;
    case 'heading2':
      row = `## ${deltaToMarkdown(data.ops || [])}`;
      break;
    case 'heading3':
      row = `### ${deltaToMarkdown(data.ops || [])}`;
      break;
    case 'heading4':
      row = `#### ${deltaToMarkdown(data.ops || [])}`;
      break;
    case 'heading5':
      row = `##### ${deltaToMarkdown(data.ops || [])}`;
      break;
    case 'heading6':
      row = `###### ${deltaToMarkdown(data.ops || [])}`;
      break;
    case 'block-quote':
      row = children.map((item) => {
        return `> ${deltaToMarkdown(item.data?.ops || [])}`;
      }).join('\n');
      ignorePath = path;
      break;
    case 'code':
      row = '```\n' + data.text + '\n```';
      break;
    case 'divider':
      row = '---';
      break;
    case 'toc':
      row = '[TOC]';
      break;
    case 'todo':
      row = children.map((item) => {
        return `- [${data.checked?.[item.id] ? 'x' : ' '}] ${deltaToMarkdown(item.data?.ops || [])}`;
      }).join('\n');
      ignorePath = path;
      break;
    }
    rows.push(row);
  });
  return rows.join('\n');
};