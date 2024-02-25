import { createBlock, type BlockModel } from '@/models/block';
import { createLogger } from '@/utils/logger';

const logger = createLogger('transform')

export const transformBlock = (trigger: string, origin: BlockModel, content: string) => {
  logger.i('transform', trigger, origin)
  if (/^#{1,6}/.test(trigger)) {
    return {
      id: origin.id,
      type: 'heading' + trigger.length,
      data: { html: content } 
    }
  }
  if (/^1\./.test(trigger)) {
    return {
      id: origin.id,
      type: 'ordered-list',
      children: [
        createBlock({
          type: 'text',
          data: {
            html: content
          }
        })
      ]
    }
  }
  if (['-', '*', '+'].includes(trigger)) {
    return {
      id:origin.id,
      type: 'unordered-list',
      children: [
        createBlock({
          type: 'text',
          data: {
            html: content
          }
        })
      ]
    }
  }
  if (['>', '&gt;'].includes(trigger)) {
    return {
      id: origin.id,
      type: 'block-quote',
      children: [
        createBlock({
          type: 'text',
          data: {
            html: content
          }
        })
      ]
    }
  }
  if (trigger === '```') {
    return {
      id: origin.id,
      type: 'code',
      data: {
        text: content
      }
    }
  }
  if (trigger === '[]' || trigger === '[x]') {
    return {
      id: origin.id,
      type: 'todo',
      children: [
        createBlock({
          type: 'text',
          data: {
            html: content
          }
        })
      ]
    }
  }
  if (['***', '---', '___'].includes(origin.data.html)) {
    return { id: origin.id, type: 'divider' }
  }
  return null
}