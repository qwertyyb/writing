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
  parseDOM: [{ tag: 'pre', preserveWhitespace: 'full' }],
  toDOM() {
    return ['pre', ['code', 0]]
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