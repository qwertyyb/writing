import type { NodeSpec } from "prosemirror-model";

export const tocSchema = (options: { group: string }): NodeSpec => ({
  selectable: true,
  group: options.group,
  toDOM () {
    return ['div', { class: 'toc-view' }]
  },
  parseDOM: [
    { tag: 'div.toc-view' }
  ]
})