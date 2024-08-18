import { Decoration, DecorationSet, type DecorationSource, type EditorView } from 'prosemirror-view'
import { Plugin, PluginKey } from 'prosemirror-state'
import type { NodeType } from 'prosemirror-model'
import { debounce } from 'lodash-es'
import { findParentNodeWithTypes } from '../utils/editor'
import BlockTool from './blockTool/BlockTool.vue'
import { createApp, h, markRaw, reactive, type Reactive } from 'vue'

const pointerMoveHandler = (
  nodeTypes: NodeType[],
  pluginKey: PluginKey,
  vmProps: Reactive<{
    position: { left: number, top: number },
    visible: boolean,
    dragging: boolean,
    pos: number
  }>
) => {

  return function(view: EditorView, event: PointerEvent) {
    if (vmProps.dragging) return
    if (!view.editable) return
    const plugin = pluginKey.get(view.state)
    if (!plugin) return;
    const prev = plugin.spec.prev
    const pos = view.posAtDOM(event.target as Node, 0)
    if (pos < 0) {
      return
    }
    const $pos = view.state.doc.resolve(pos)
    const curNode = $pos.parent.maybeChild($pos.index())
    const target = findParentNodeWithTypes(view.state, $pos, nodeTypes) || (curNode && nodeTypes.includes(curNode.type) ? { node: curNode, depth: $pos.depth + 1 } : null)
    console.log('target', target)
    if (!target) {
      return;
    }
    const from = $pos.before(target.depth)
    const to = $pos.after(target.depth)
    if (prev?.from === from && prev?.to === to) return;
    plugin.spec.prev = { from, to }
    view.dispatch(view.state.tr.setMeta(pluginKey, { from: $pos.before(target.depth), to: from + target.node.nodeSize }))
    const nodeDOM = view.nodeDOM(from)
    if (!nodeDOM) return
    const rect = (nodeDOM as HTMLElement).getBoundingClientRect()
    const pRect = view.dom.offsetParent!.getBoundingClientRect()
    vmProps.visible = true
    vmProps.pos = from
    vmProps.position = {
      top: rect.top - pRect.top + rect.height / 2,
      left: rect.left - pRect.left
    }
  }
}

export const blocksTool = (draggableNodeTypes: NodeType[]) => {
  const vmProps = reactive<{
    position: { top: 0, left: 0 },
    visible: boolean,
    dragging: boolean,
    view: EditorView | null,
    pos: number,
    onDragStart: () => void,
  }>({
    position: { top: 0, left: 0 },
    visible: false,
    dragging: false,
    view: null,
    pos: 0,
    onDragStart() {
      vmProps.dragging = true
    },
  })
  const vm = createApp({
    render: () => h(BlockTool, vmProps as any)
  })

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
        pointermove: debounce(pointerMoveHandler(draggableNodeTypes, pluginKey, vmProps), 60),
        pointerleave: (view) => {
          // view.dispatch(view.state.tr.setMeta(pluginKey, null))
        }
      },
      decorations(state): DecorationSource | null | undefined {
        return plugin.getState(state)
      }
    },
    view(view) {
      vmProps.view = markRaw(view)
      const dom = document.createElement('div')
      dom.classList.add('plugin-block-tool')
      view.dom.parentElement?.prepend(dom)
      vm.mount(dom)
      return {
        destroy() {
          vm.unmount()
          dom.remove()
        },
      }
    },
  })
  return plugin
}