import type { MarkdownSerializerState } from "prosemirror-markdown";
import type { NodeSpec, Node } from "prosemirror-model";
import { toDOMRender } from "../plugins/vueNodeViews";
import ExcalidrawView from "../nodeViews/ExcalidrawView.vue";
import { createLogger } from "@writing/utils/logger";

const logger = createLogger('excalidraw')

export const excalidrawSchema = (options: Partial<NodeSpec>): NodeSpec => ({
  attrs: {
    src: {},
    ratio: { default: null },
    width: { default: null },
    align: { default: 'center' }, // left | center | right
    href: { default: null }
  },
  // atom: true,
  selectable: true,
  content: 'plain_text',
  toDOM(node) {
    return toDOMRender(node, ExcalidrawView)
  },
  parseDOM: [
    {
      tag: 'div.excalidraw-view',
      getAttrs(node) {
        if (!node || typeof node === 'string') return false
        try {
          return JSON.parse(node.dataset.attrs!)
        } catch (err) {
          logger.e('parse err', err)
          return false
        }
      },
      contentElement: 'figcaption.editor-base-image-title'
    }
  ],
  ...options
})

export const markdownSerialize = (state: MarkdownSerializerState, node: Node, parent: Node, index: number) => {
  const image = `![${state.esc(node.textContent)}](${node.attrs.src}#align-${node.attrs.align} ${JSON.stringify(node.textContent)})`
  const linkImage = node.attrs.href ? `[${image}](${node.attrs.href || ''})` : image
  state.write(linkImage)
  state.ensureNewLine()
}