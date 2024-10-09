import type { MarkdownSerializerState } from "prosemirror-markdown"
import { Node, type NodeSpec } from "prosemirror-model"

export const codeBlockSchema = (options: { content: string, group: string }): NodeSpec => ({
  attrs: {
    language: { default: '' }
  },
  content: options.content,
  marks: '',
  group: options.group,
  code: true,
  defining: true,
  parseDOM: [
    {
      tag: 'pre',
      preserveWhitespace: 'full',
      getAttrs(node) {
        if (typeof node === 'string') return false
        return {
          language: node.dataset.language || ''
        }
      },
    }
  ],
  toDOM(node) {
    return ['pre', { 'data-language': node.attrs.language }, ['code', 0]]
  }
})

export const codeBlockMarkdownSerialize = (state: MarkdownSerializerState, node: Node, parent: Node, index: number) => {
  state.write(`\`\`\`${node.attrs.language || ''}`)
  state.ensureNewLine()
  state.text(node.textContent, false)
  state.ensureNewLine()
  state.write('```')
  state.closeBlock(node)
}