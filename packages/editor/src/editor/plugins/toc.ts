import { Plugin } from 'prosemirror-state'
import { createVuePluginView } from '../utils/vuePluginView'
import DocumentToc from '../components/DocumentToc.vue'

export interface TocItem {
  text: string
  level: number
  pos: number
}

export const toc = () => {
  return new Plugin({
    view(view) {
      return createVuePluginView(
        DocumentToc,
        view,
        (view) => {
        const doc = view.state.doc
        const results: TocItem[] = []
        doc.descendants((node, pos) => {
          if (node.type.name === 'heading') {
            const $pos = doc.resolve(pos)
            results.push({ text: node.textContent, level: $pos.depth, pos: pos })
            return false
          }
        })
        return { toc: results }
      })
    },
  })
}