import { Decoration, DecorationSet, type DecorationSource, type EditorView } from 'prosemirror-view'
import { Plugin, PluginKey } from 'prosemirror-state'
import type { NodeType } from 'prosemirror-model'
import { debounce } from 'lodash-es'
import { findParentNodeWithTypes } from '../../utils/editor'
import BlockTool from './BlockTool.vue'
import { createApp, h, markRaw, reactive, type Reactive } from 'vue'
import { createLogger } from '@writing/utils/logger'

const logger = createLogger('block-tool')

const pointerMoveHandler = (
  nodeTypes: NodeType[],
  pluginKey: PluginKey,
  vmProps: Reactive<{
    position: { left: number, top: number },
    visible: boolean,
    dragging: boolean,
    panelVisible: boolean,
    pos: number
  }>
) => {
  return function(view: EditorView, event: PointerEvent) {
    if (vmProps.dragging || vmProps.panelVisible) return
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
    logger.d('block pos update', from, nodeDOM)
  }
}

export const blockTool = (draggableNodeTypes: NodeType[]) => {
  const vmProps = reactive<{
    position: { top: 0, left: 0 },
    visible: boolean,
    dragging: boolean,
    view: EditorView | null,
    panelVisible: boolean,
    pos: number,
    onPanelShow: () => void,
    onPanelHide: () => void,
    onDragStart: () => void,
    onDragEnd: () => void,
  }>({
    position: { top: 0, left: 0 },
    visible: false,
    dragging: false,
    panelVisible: false,
    view: null,
    pos: 0,
    onPanelShow() {
      vmProps.panelVisible = true
    },
    onPanelHide() {
      vmProps.panelVisible = false
    },
    onDragStart() {
      vmProps.dragging = true
    },
    onDragEnd() {
      vmProps.dragging = false
    },
  })
  const vm = createApp({
    render: () => h(BlockTool, vmProps as any)
  })

  const pluginKey = new PluginKey('blocksTool')
  const pointerHandler = pointerMoveHandler(draggableNodeTypes, pluginKey, vmProps)
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
        pointermove: pointerHandler,
        pointerdown: pointerHandler
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