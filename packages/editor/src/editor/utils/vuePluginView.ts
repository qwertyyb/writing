import { type PluginView } from "prosemirror-state"
import { EditorView } from "prosemirror-view"
import {
  createApp,
  h,
  type App,
  type Component,
  markRaw,
  type Ref,
  ref,
} from 'vue'

class VuePluginView implements PluginView {
  vm: App
  vmProps: Ref<any> = ref()

  constructor(Component: Component, view: EditorView, private getProps: (view: EditorView, prevProps: any | null) => any, side: 'before' | 'after' = 'before') {
    this.vmProps.value = { view: markRaw(view), ...getProps(view, null) }
    const vm = createApp({
      render: () => h(Component, this.vmProps.value as any)
    })
    const dom = document.createElement('div')
    if (side === 'before') {
      view.dom.parentElement?.prepend(dom)
    } else {
      view.dom.parentNode?.append(dom)
    }
    vm.mount(dom)
    this.vm = vm
  }

  update(view: EditorView) {
    this.vmProps.value = { view: markRaw(view), ...this.getProps(view, this.vmProps) }
  }

  destroy() {
    this.vm.unmount()
  }
}

export const createVuePluginView = (
  Component: Component,
  view: EditorView,
  getProps: (view: EditorView, prevProps: any | null) => any,
  side: 'before' | 'after' = 'before',
) => new VuePluginView(Component, view, getProps, side)
