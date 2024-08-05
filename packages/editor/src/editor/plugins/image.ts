import type { NodeType } from "prosemirror-model"
import { EditorState, NodeSelection, Plugin } from "prosemirror-state"
import { Decoration, DecorationSet } from "prosemirror-view"

const rangeHasNodeType = (nodeType: NodeType, from: number, to: number, state: EditorState) => {
  let hasNodeType = false
  state.doc.nodesBetween(from, to, (node) => {
    if (hasNodeType) {
      // find node type already, no need for child
      return false
    }
    if (node.type === nodeType) {
      hasNodeType = true
      return false
    }
  })
  return hasNodeType
}

const imageDecorations = (state: EditorState) => {
  if (!(state.selection instanceof NodeSelection)) {
    return null
  }
  if(state.selection.node.type === state.schema.nodes.image) {
    // 图片节点
    return DecorationSet.create(state.doc, [
      Decoration.widget(state.selection.from, (view, getPos) => {
        const resizer = document.createElement('div')
        resizer.classList.add('resizer')
        return resizer
      })
    ])
  }
  return null
}

export const image = () => {
  return new Plugin({
    props: {
      decorations(state) {
        console.log('image')
        return imageDecorations(state)
      },
    }
  })
}