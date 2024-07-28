import type { EditorView } from 'codemirror'
import type { Node } from 'prosemirror-model'
import { Plugin } from 'prosemirror-state'
import type { Decoration, DecorationSource, NodeView } from 'prosemirror-view'
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
import type BaseView from '../node-views/BaseView.vue'

export interface VueNodeViewProps<N extends Node = Node> {
  node: N
  view: EditorView
  getPos: () => number
  decorations: readonly Decoration[]
  innerDecorations: DecorationSource
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
    view: EditorView,
    getPos: () => number,
    decorations: Decoration[],
    innerDecorations: DecorationSource
  ) {
    this.vmProps = shallowReactive({
      node: markRaw(node),
      view: markRaw(view),
      getPos: markRaw(getPos),
      decorations: markRaw(decorations),
      innerDecorations: markRaw(innerDecorations),
      ref: this.vm
    })
    this.vmApp = createApp({
      render: () => h(Component, this.vmProps)
    })
    this.vmApp.mount(this.root)
  }
  update = (node: Node, decorations: readonly Decoration[], innerDecorations: DecorationSource) => {
    if (this.vmProps) {
      this.vmProps.node = markRaw(node as N)
      this.vmProps.decorations = markRaw(decorations)
      this.vmProps.innerDecorations = markRaw(innerDecorations)
      return false
    }
    return true
  }
  ignoreMutation = (mutation: MutationRecord) => {
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

export const vueNodeViews = (nodeViewsSpec: Record<string, Component>) => {
  const nodeViews = Object.entries(nodeViewsSpec).reduce((acc, [nodeName, Component]) => {
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
