import { createLogger } from '@writing/utils/logger';
import { BlockTree } from './BlockTree';
import { BlockModel } from './block';
import * as R from 'ramda';
import { Op } from 'quill-delta';

const logger = createLogger('markdown');

interface InlineFormats {
  bold: boolean,
  italic: boolean,
  code: boolean,
  strike: boolean,
  underline: boolean,

  script: 'sub' | 'super',

  link: string,
  background: string,
  color: string,
  size: string
}

const attrTrans = <K extends keyof InlineFormats>(text: string, key: K, value: InlineFormats[K]) => {
  const map = {
    bold: `**${text}**`,
    italic: `*${text}*`,
    code: '`' + text + '`',
    strike: `~~${text}~~`,
    underline: `<span style="text-decoration:underline">${text}</span>`,

    script: value === 'sup' ? `<sup>${text}</sup>` : value === 'sub' ? `<sub>${text}</sub>` : text,

    link: `[text](${value})`,
    background: `<span style="background-color:${value}">${text}</span>`,
    color: `<span style="color:${value}">${text}</span>`,
    size: `<span style="font-size:${value}">${text}</span>`
  };
  return map[key] ?? '';
};

const deltaToMarkdown = (ops: Op[]) => {
  return ops
    .filter(op => typeof op.insert === 'string')
    .map(op => {
      const attrs = (op.attributes || {}) as Partial<InlineFormats> | undefined;
      return Object.entries(attrs).reduce<string>((acc, [key, val]) => {
        return attrTrans(acc, key as keyof InlineFormats, val);
      }, op.insert as string || '');
    })
    .join('');
};

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
        logger.i(index, item.data.ops);
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
      row = `\`\`\`${data.language || ''}\n${data.text}\n\`\`\``;
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