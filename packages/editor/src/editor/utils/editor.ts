import { ContentMatch, Node, NodeType, ResolvedPos } from "prosemirror-model"
import type { EditorState } from "prosemirror-state"

export function defaultBlockAt(match: ContentMatch) {
  for (let i = 0; i < match.edgeCount; i++) {
    const {type} = match.edge(i)
    if (type.isTextblock && !type.hasRequiredAttrs()) return type
  }
  return null
}

export const findParent = (state: EditorState, pos: ResolvedPos, pred: (node: Node, depth: number) => boolean) => {
  for(let i = pos.depth; i >= 0; i -= 1) {
    const node = pos.node(i)
    if (node && pred(node, i)) {
      return { node, depth: i }
    }
  }
  return null
}

export const findParentNode = (state: EditorState, pos: ResolvedPos, nodeType: NodeType) => {
  return findParent(state, pos, (node) => node.type === nodeType)
}

export const findParentNodeWithTypes = (state: EditorState, pos: ResolvedPos, nodeTypes: NodeType[]) => {
  return nodeTypes.reduce<{ node: Node, depth: number } | null>((result, nodeType) => {
    if (result) return result
    return findParentNode(state, pos, nodeType)
  }, null)
}