import type { NodeType } from "prosemirror-model"
import { Plugin } from "prosemirror-state"

export const appendParagraph = (nodeType: NodeType) => {
  return new Plugin({
    appendTransaction(transactions, oldState, newState) {
      // 如果最后一个 node 不是paragraph, 则往末尾添加一个paragraph
      const { childCount } = newState.doc
      if (newState.doc.maybeChild(childCount - 1)?.type !== nodeType) {
        return newState.tr.insert(newState.doc.content.size - 1, nodeType.createAndFill()!)
      }
    },
  })
}