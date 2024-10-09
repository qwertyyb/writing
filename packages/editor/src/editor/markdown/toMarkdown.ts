import { MarkdownSerializer, defaultMarkdownSerializer } from 'prosemirror-markdown'
import { markdownSerialize as todoSerialize } from '../nodes/todo'
import { markdownSerialize as imageSerialize } from '../nodes/image'
import { markdownDetailsSerialize as detailsSerialize, markdownDetailsSummarySerialize as detailsSummarySerialize } from '../nodes/details'
import { codeBlockMarkdownSerialize as codeBlockSerialize } from '../nodes/code'
import { calloutMarkdownSerialize } from '../nodes/callout'
import { katexBlockMarkdownSerialize, katexMarkdownSerialize } from '../nodes/katex'
import { markdownSerialize as tocSerialize } from '../nodes/toc'
import { markdownSerialize as excalidrawSerialize } from '../nodes/excalidraw'

export const markdownSerializer = new MarkdownSerializer(
  {
    ...defaultMarkdownSerializer.nodes,
    todo: todoSerialize,
    image: imageSerialize,
    code_block: codeBlockSerialize,

    details: detailsSerialize,
    details_summary: detailsSummarySerialize,

    callout: calloutMarkdownSerialize,

    katex_block: katexBlockMarkdownSerialize,
    katex: katexMarkdownSerialize,
    toc: tocSerialize,
    excalidraw: excalidrawSerialize
  },
  {
    ...defaultMarkdownSerializer.marks,
    del: {open: "~~", close: "~~", mixable: true, expelEnclosingWhitespace: true},
    color: {
      open(state, mark) {
        return `<span style="color:${mark.attrs.color}">`
      },
      close: '</span>',
      mixable: true
    },
    backgroundColor: {
      open(state, mark) {
        return `<span style="background-color:${mark.attrs.backgroundColor}">`
      },
      close: '</span>',
      mixable: true
    },
    super: { open: '<sup>', close: '</sup>', mixable: true },
    sub: { open: '<sub>', close: '</sub>', mixable: true },
    underline: { open: '<span style="text-decoration:underline">', close: '</span>', mixable: true }
  }
)