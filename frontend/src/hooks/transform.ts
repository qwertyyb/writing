import type { BlockModel } from '@/models/block';

export const transformBlock = (origin: BlockModel) => {
  if (/^#{1,6}$/.test(origin.data.html)) {
    return { id: origin.id, type: 'heading' + origin.data.html.length, data: { html: '' } }
  }
  if (origin.data.html === '1.') {
    return { id: origin.id, type: 'ordered-list', children: [] }
  }
  if (['-', '*', '+'].includes(origin.data.html)) {
    return { id: origin.id, type: 'unordered-list', children: [] }
  }
  if (['>', '&gt;'].includes(origin.data.html)) {
    return { id: origin.id, type: 'block-quote' }
  }
  if (origin.data.html === '```') {
    return { id: origin.id, type: 'code' }
  }
  if (['***', '---', '___'].includes(origin.data.html)) {
    return { id: origin.id, type: 'divider' }
  }
  return origin
}