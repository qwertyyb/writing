import { Decoration, DecorationSet, type DecorationSource, type EditorView } from 'prosemirror-view'
import { Plugin, PluginKey } from 'prosemirror-state'
import type { NodeType } from 'prosemirror-model'
import { debounce } from 'lodash-es'
import { findParentNodeWithTypes } from '../utils/editor'


const pointerMoveHandler = (nodeTypes: NodeType[], pluginKey: PluginKey) => {
  return function(view: EditorView, event: PointerEvent) {
    const plugin = pluginKey.get(view.state)
    if (!plugin) return;
    const prev = plugin.spec.prev
    const pos = view.posAtCoords({ left: event.clientX, top: event.clientY })
    if (!pos) {
      if (prev || pos!.pos < 0) {
        plugin.spec.prev = null
        view.dispatch(view.state.tr.setMeta(pluginKey, null));
      }
      return
    }
    const $pos = view.state.doc.resolve(pos.pos)
    const curNode = $pos.parent.maybeChild($pos.index())
    const target = findParentNodeWithTypes(view.state, $pos, nodeTypes) || (curNode && nodeTypes.includes(curNode.type) ? { node: curNode, depth: $pos.depth + 1 } : null)
    if (!target) {
      if (prev) {
        plugin.spec.prev = null
        view.dispatch(view.state.tr.setMeta(pluginKey, null));
      }
      return;
    }
    const from = $pos.before(target.depth)
    const to = $pos.after(target.depth)
    if (prev?.from !== from && prev?.to !== to) {
      plugin.spec.prev = { from, to }
      view.dispatch(view.state.tr.setMeta(pluginKey, { from: $pos.before(target.depth), to: from + target.node.nodeSize }))
    }
    return false
  }
}

export const blocksTool = (draggableNodeTypes: NodeType[]) => {
  const pluginKey = new PluginKey('blocksTool')
  const plugin = new Plugin({
    key: pluginKey,
    state: {
      init() {
        return DecorationSet.empty
      },
      apply(tr, value, oldState, newState) {
        const range = tr.getMeta(pluginKey)
        if (!range) return DecorationSet.empty;
        return DecorationSet.create(newState.doc, [
          Decoration.node(range.from, range.to, { class: 'hover' })
        ])
      },
    },
    props: {
      handleDOMEvents: {
        pointermove: debounce(pointerMoveHandler(draggableNodeTypes, pluginKey), 60),
        pointerleave: (view) => {
          view.dispatch(view.state.tr.setMeta(pluginKey, null))
        }
      },
      decorations(state): DecorationSource | null | undefined {
        return plugin.getState(state)
      }
    },
  })
  return plugin
}