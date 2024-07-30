import crelt from "crelt";
import type { Node } from "prosemirror-model";

export const createImageNode = (node: Node) => {
  const image = crelt('figure', {
    alt: node.attrs.title,
    class: 'image',
    tabindex: 0,
    src: node.attrs.src || 'https://via.placeholder.com/200',
    title: node.attrs.title,
    style: `width:${node.attrs.size}%;resize:both`
  })
  const dom = crelt('div', {
    tabindex: 0,
    class: ['image-node', `align-${node.attrs.align}`].join(' '),
  }, image)
  return {
    dom
  }
}