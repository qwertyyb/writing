import type { MarkdownSerializerState } from "prosemirror-markdown";
import type { NodeSpec, Node } from "prosemirror-model";

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

export const markdownSerialize = (state: MarkdownSerializerState, node: Node, parent: Node, index: number) => {
  state.write('[TOC]')
  state.closeBlock(node)
}