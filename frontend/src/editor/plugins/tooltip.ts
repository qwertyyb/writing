import type { EditorView } from 'prosemirror-view'
import { EditorState, Plugin } from 'prosemirror-state'
import { createApp, shallowRef, type App } from 'vue'
import TooltipPluginVue from './TooltipPlugin.vue'

class SelectionTooltip {
  tooltip: HTMLDivElement
  app?: App

  constructor(view: EditorView) {
    this.tooltip = document.createElement("div")
    this.tooltip.className = "editor-plugin-tooltip-container"
    this.tooltip.style.position = 'absolute'
    view.dom.parentNode!.appendChild(this.tooltip)

    this.update(view, null)
  }

  update(view: EditorView, lastState: EditorState | null) {
    const state = view.state
    // 如果文档或者选区未发生更改，则什么不做
    if (lastState && lastState.doc.eq(state.doc) &&
        lastState.selection.eq(state.selection)) return

    // 如果选区为空（光标状态）则隐藏 tooltip
    if (state.selection.empty) {
      this.tooltip.style.display = "none"
      return
    }

    // 否则，重新设置它的位置并且更新它的内容
    this.tooltip.style.display = ""
    const {from, to} = state.selection
    // 这些是在屏幕上的坐标信息
    const start = view.coordsAtPos(from), end = view.coordsAtPos(to)
    // 将 tooltip 所在的父级节点作为参照系
    const box = this.tooltip.offsetParent!.getBoundingClientRect()
    // 寻找 tooltip 的中点，当跨行的时候，端点可能更靠近左侧
    const left = Math.max((start.left + end.left) / 2, start.left + 3)
    this.tooltip.style.left = (left - box.left) + "px"
    this.tooltip.style.bottom = (box.bottom - start.top + 34) + "px"
    this.app?.unmount()
    this.app = createApp(TooltipPluginVue, { editor: shallowRef(view) })
    this.app.mount(this.tooltip)
    // this.tooltip.textContent = (to - from).toString()
  }

  destroy() { this.tooltip.remove() }
}

export const tooltipPlugin = new Plugin({
  view(editorView) { return new SelectionTooltip(editorView) }
})