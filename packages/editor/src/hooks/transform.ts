import { createBlock, type BlockModel } from '../models/block';
import { toText } from '../models/delta';
import { createLogger } from '@writing/utils/logger';
import type { Op } from 'quill-delta';

const logger = createLogger('transform');

export const transformBlock = (trigger: string, origin: BlockModel, content: Op[]) => {
  logger.i('transform', trigger, origin);
  if (/^#{1,6}$/.test(trigger)) {
    return {
      id: origin.id,
      type: 'heading' + trigger.length,
      data: { ops: content }, 
    };
  }
  if (/^(1|a|A)\.$/.test(trigger)) {
    return {
      id: origin.id,
      type: 'ordered-list',
      children: [
        createBlock({
          type: 'text',
          data: {
            ops: content
          },
          children: origin.children || []
        })
      ]
    };
  }
  if (['-', '*', '+'].includes(trigger)) {
    return {
      id:origin.id,
      type: 'unordered-list',
      children: [
        createBlock({
          type: 'text',
          data: {
            ops: content
          },
          children: origin.children || []
        })
      ]
    };
  }
  if (['>', '&gt;'].includes(trigger)) {
    return {
      id: origin.id,
      type: 'block-quote',
      children: [
        createBlock({
          type: 'text',
          data: {
            ops: content
          },
          children: origin.children || []
        })
      ]
    };
  }
  if (/^```\S*$/.test(trigger)) {
    const language = trigger.substring(3);
    return {
      id: origin.id,
      type: 'code',
      data: {
        language,
        text: toText(content)
      }
    };
  }
  if (['[]', '[ ]'].includes(trigger)) {
    return {
      id: origin.id,
      type: 'todo',
      children: [
        createBlock({
          type: 'text',
          data: {
            ops: content
          },
          children: origin.children || []
        })
      ]
    };
  }
  if (trigger === '[x]') {
    const first = createBlock({
      type: 'text',
      data: {
        ops: content
      }
    });
    return {
      id: origin.id,
      type: 'todo',
      data: {
        checked: { [first.id]: true }
      },
      children: [
        first
      ]
    };
  }
  if (['***', '---', '___'].includes(toText(origin.data.ops))) {
    return { id: origin.id, type: 'divider' };
  }
  if (trigger == '$$') {
    // 转换为数学公式
    return {
      id: origin.id,
      type: 'katex',
      data: {
        source: toText(content)
      }
    };
  }
  return null;
};