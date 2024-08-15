import { Node, NodeType, type NodeSpec } from "prosemirror-model";
import { toDOMRender } from "../plugins/vueNodeViews";
import KatexBlockView from '../nodeViews/KatexBlockView.vue'
import { InputRule } from "prosemirror-inputrules";
import type { MarkdownSerializerState } from "prosemirror-markdown";

export const katexBlockSchema = (options: { group: string }): NodeSpec => ({
  attrs: {
    source: {
      default: ''
    }
  },
  selectable: true,
  group: options.group,
  marks: '',
  toDOM(node) {
    return toDOMRender(node, KatexBlockView)
  },
  parseDOM: [
    {
      tag: 'div.katex-block-view',
      getAttrs(node) {
        if (typeof node === 'string') return false
        return { source: node.dataset.katexSource }
      },
    }
  ]
})

export const katexSchema = (options: { group: string }): NodeSpec => ({
  group: options.group,
  attrs: {
    source: { default: '' }
  },
  selectable: true,
  atom: true,
  marks: '',
  inline: true,
  toDOM(node) {
    const span = document.createElement('span')
    span.classList.add('katex')
    span.dataset.katexSource = node.attrs.source
    import('katex').then(({ default: katex }) => {
      katex.render(node.attrs.source, span, { throwOnError: false, output: 'mathml' })
    })
    return { dom: span }
  },
  parseDOM: [
    {
      tag: 'span.katex',
      getAttrs(node) {
        if (typeof node === 'string') return false
        return {
          source: node.dataset.katexSource
        }
      },
    }
  ]
})

export const katexBlockRule = (nodeType: NodeType) => {
  return new InputRule(
    /^\$\$([\s\S]+)\$\$$/,
    (state, match, start, end) => {
      return state.tr.replaceRangeWith(start, end, nodeType.create({ source: match[1] }))
    }
  )
}

export const katexRule = (nodeType: NodeType) => {
  return new InputRule(/(?<!\$)\$([^$]+)\$$/, (state, match, start, end) => {
    return state.tr.replaceWith(start, end, nodeType.create({ source: match[1] }))
  })
}

export const katexBlockMarkdownSerialize = (state: MarkdownSerializerState, node: Node) => {
  state.text('$$')
  state.ensureNewLine()
  state.text(node.attrs.source)
  state.ensureNewLine()
  state.text('$$')
  state.ensureNewLine()
}

export const katexMarkdownSerialize = (state: MarkdownSerializerState, node: Node) => {
  state.text(`$${node.attrs.source || ''}$`)
}