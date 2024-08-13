import { MarkdownSerializer, defaultMarkdownSerializer } from 'prosemirror-markdown'
import { markdownSerialize as todoSerialize } from './nodes/todo'
import { markdownSerialize as imageSerialize } from './nodes/image'
import { markdownDetailsSerialize as detailsSerialize, markdownDetailsSummarySerialize as detailsSummarySerialize } from './nodes/details'
import { codeBlockMarkdownSerialize as codeBlockSerialize } from './nodes/code'
import { calloutMarkdownSerialize } from './nodes/callout'

export const markdownSerializer = new MarkdownSerializer(
  {
    ...defaultMarkdownSerializer.nodes,
    todo: todoSerialize,
    image: imageSerialize,
    code_block: codeBlockSerialize,

    details: detailsSerialize,
    details_summary: detailsSummarySerialize,

    callout: calloutMarkdownSerialize
  },
  defaultMarkdownSerializer.marks
)