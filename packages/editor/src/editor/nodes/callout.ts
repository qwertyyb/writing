import type { NodeSpec } from 'prosemirror-model'
import CalloutView from '../nodeViews/CalloutView.vue'
import { toDOMRender } from '../plugins/vueNodeViews'

export const callout = (options: { content: string; group: string }): NodeSpec => ({
  selectable: true,
  content: options.content,
  group: options.group,
  attrs: {
    icon: { default: '💡' }
  },
  parseDOM: [
    {
      tag: '.callout-view',
      getAttrs(node) {
        if (typeof node === 'string') return false
        const icon = node.querySelector<HTMLElement>('.callout-icon')
        if (!icon) return false
        return {
          icon: icon.textContent?.trim() || '💡'
        }
      },
      contentElement: '[data-prosemirror-content-dom]'
    }
  ],
  toDOM(node) {
    return toDOMRender(node, CalloutView)
  }
})
