import type { MarkdownSerializerState } from "prosemirror-markdown";
import type { NodeSpec, Node } from "prosemirror-model";

export const excalidrawSchema = (options: Partial<NodeSpec>): NodeSpec => ({
  attrs: {
    src: {},
    ratio: { default: null },
    width: { default: null },
    align: { default: 'center' }, // left | center | right
    href: { default: null }
  },
  // atom: true,
  selectable: true,
  content: 'plain_text',
  toDOM(node) {
    return ['div', { class: 'excalidraw-view' }, 0]
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

export const markdownSerialize = (state: MarkdownSerializerState, node: Node, parent: Node, index: number) => {
  const image = `![${state.esc(node.textContent)}](${node.attrs.src}#align-${node.attrs.align} ${JSON.stringify(node.textContent)})`
  const linkImage = node.attrs.href ? `[${image}](${node.attrs.href || ''})` : image
  state.write(linkImage)
  state.ensureNewLine()
}