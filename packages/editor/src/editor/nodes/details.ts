import type { NodeSpec, NodeType } from "prosemirror-model"
import { Plugin, TextSelection, type Command } from "prosemirror-state"
import { defaultBlockAt, findParentNode } from "../utils/editor"

export const detailsSchema = (options: { summaryContent: string, detailsContent: string, detailsGroup: string }): { details_summary: NodeSpec, details: NodeSpec } => {
  return {
    details_summary: {
      selectable: true,
      content: options.summaryContent,
      parseDOM: [{ tag: 'summary' }],
      toDOM() {
        return ['summary', 0]
      },
    },
  
    details: {
      group: options.detailsGroup,
      draggable: true,
      marks: '',
      attrs: {
        open: { default: true },
      },
      content: `details_summary ${options.detailsContent}`,
      toDOM(node) {
        console.log('toDOM')
        const open = node.attrs.open
        return ['details', open ? { open: true } : {}, 0]
      },
      parseDOM: [
        {
          tag: 'details',
          getAttrs(node) {
            if (typeof node === 'string') {
              return null
            }
            return { open: node.hasAttribute('open') }
          },
        },
      ],
    },
  }
}

// 如果 details 是关闭状态，回车键时，在后面创建一个段落
export const addBlockAfterDetails = (summaryNode: NodeType): Command => {
  return (state, dispatch) => {
    const { $from, $to } = state.selection
    if ($from.parent.type !== summaryNode) return false
    // 只处理 open=false 的情况
    if ($from.node(-1).attrs.open) return false
    const contentMatch = $from.node(-2).contentMatchAt($to.indexAfter(-1))
    const matchNodeType = defaultBlockAt(contentMatch)
    if (!matchNodeType) return false
    const node = matchNodeType.createAndFill()
    if (!node) return false
    if (dispatch) {
      const pos = $to.after(-1)
      const tr = state.tr.insert(pos, node)
      dispatch(
        tr.setSelection(TextSelection.create(tr.doc, pos + 1))
          .scrollIntoView()
      )
    }
    return true
  }
}

export const detailsPlugin = (nodeType: NodeType) => {
  return new Plugin({
    // 如果 selection 位于已关闭的 details 中，则把 selection 挪到 summary 最后面
    appendTransaction(transactions, oldState, newState) {
      const { $from } = transactions[transactions.length - 1].selection
      const details = findParentNode(newState, $from, nodeType)
      if (!details || details.node.attrs.open) return null
      const index = $from.index(details.depth)
      // 第一个节点是 summary
      if (index === 0) return null
      const $summaryPos = newState.doc.resolve($from.before(details.depth) + 2)
      return newState.tr.setSelection(TextSelection.create(newState.doc, $summaryPos.end()))
    },
  })
}

