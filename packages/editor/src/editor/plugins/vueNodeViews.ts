import type { Attrs, Node, NodeType, Schema } from 'prosemirror-model'
import { Plugin } from 'prosemirror-state'
import type { Decoration, DecorationSource, EditorView, NodeView } from 'prosemirror-view'
import {
  createApp,
  h,
  type App,
  type Component,
  type ShallowReactive,
  shallowReactive,
  markRaw,
  ref,
} from 'vue'
import type BaseView from '../nodeViews/BaseView.vue'

export interface VueNodeViewProps<N extends Node = Node> {
  node: N
  view?: EditorView
  getPos?: () => number
  decorations?: readonly Decoration[]
  innerDecorations?: DecorationSource
}

type BaseViewComponent = typeof BaseView

class VueNodeView<N extends Node = Node> implements NodeView {
  root = document.createElement('div')
  vmApp: App | null
  vmProps: ShallowReactive<VueNodeViewProps<N>> | null
  vm = ref<InstanceType<BaseViewComponent>>()

  get dom() {
    return this.root.querySelector<HTMLElement>('[data-prosemirror-dom]') || this.vm.value?.$el || this.root
  }

  get contentDOM() {
    return this.root.querySelector<HTMLElement>('[data-prosemirror-content-dom]') || (this.vm.value?.$el as HTMLElement).querySelector('[data-prosemirror-content-dom]') || null
  }

  get selectNode() {
    return this.vm.value?.selectNode
  }

  constructor(
    Component: Component,
    node: N,
    view?: EditorView,
    getPos?: () => number,
    decorations?: Decoration[],
    innerDecorations?: DecorationSource
  ) {
    this.vmProps = shallowReactive({
      node: markRaw(node),
      ...(Object.entries({view, getPos, decorations, innerDecorations}).reduce((acc, [key, value]) => {
        if (value) {
          return {
            ...acc,
            [key]: markRaw(value)
          }
        }
        return acc
      }, {})),
      ref: this.vm,
      onUpdateAttrs: this.updateAttrs
    })
    this.vmApp = createApp({
      render: () => h(Component, this.vmProps)
    })
    this.vmApp.mount(this.root)
  }
  updateAttrs = (attrs: Attrs) => {
    const view = this.vmProps?.view
    if (!view) return;
    const tr = view.state.tr
    const pos = this.vmProps!.getPos!()
    Object.entries(attrs).forEach(([key, value]) => {
      tr.setNodeAttribute(pos, key, value)
    })
    view.dispatch(tr)
  }
  update = (node: Node, decorations: readonly Decoration[], innerDecorations: DecorationSource) => {
    if (node.type !== this.vmProps?.node.type) {
      this.destroy()
      return false
    }
    if (this.vmProps) {
      this.vmProps.node = markRaw(node as N)
      this.vmProps.decorations = markRaw(decorations)
      this.vmProps.innerDecorations = markRaw(innerDecorations)
      return true
    }
    return false
  }
  ignoreMutation = (mutation: MutationRecord) => {
    if ((mutation.type as any) === 'selection') {
      return false;
    }
    if (this.contentDOM && (this.contentDOM === mutation.target || this.contentDOM.contains(mutation.target))) {
      return false
    }
    return true
  }
  destroy = () => {
    this.vmApp?.unmount()
    this.vmApp = null
    this.vm.value = undefined
    this.vmProps = null
  }
}

export const vueNodeViews = (schema: Schema, nodeViewsSpec: Record<string, Component>) => {
  const nodeViews = Object.entries(nodeViewsSpec).reduce((acc, [nodeName, Component]) => {
    const nodeType = schema.nodes[nodeName]
    if (!nodeType) {
      return acc
    }
    return {
      ...acc,
      [nodeName](
        node: Node,
        view: EditorView,
        getPos: () => number,
        decorations: Decoration[],
        innerDecorations: DecorationSource
      ) {
        return new VueNodeView(Component, node, view, getPos, decorations, innerDecorations)
      }
    }
  }, {})

  return new Plugin({
    props: {
      nodeViews
    }
  })
}

export const toDOMRender = (node: Node, Component: Component) => {
  return new VueNodeView(Component, node) as { dom: HTMLElement, contentDOM: HTMLElement | undefined }
}
