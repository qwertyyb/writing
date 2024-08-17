import type { NodeSpec } from "prosemirror-model";

export const excalidrawSchema = (options: Partial<NodeSpec>): NodeSpec => ({
  attrs: {
    content: { default: null }
  },
  atom: true,
  selectable: true,
  toDOM(node) {
    return ['div', { class: 'excalidraw-view' }]
  },
  parseDOM: [
    {
      tag: 'div.excalidraw-view',
      getAttrs(node) {
        if (typeof node === 'string') return false
        return { content: null }
      },
    }
  ],
  ...options
})