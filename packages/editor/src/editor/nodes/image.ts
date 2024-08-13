import type { Node, NodeSpec, NodeType } from "prosemirror-model";
import { toDOMRender } from "../plugins/vueNodeViews";
import ImageView from "../nodeViews/ImageView.vue";
import { TextSelection, type Command } from "prosemirror-state";
import { defaultBlockAt } from "../utils/editor";
import type { MarkdownSerializerState } from "prosemirror-markdown";

const parseImageViewRule = () => ({
  tag: 'figure.editor-image-node',
  getAttrs(node: string | HTMLElement) {
    if (typeof node === 'string') return false
    const img = node.querySelector<HTMLImageElement>('img.editor-image-node-image')
    const src = img?.src
    if (!src) return false
    const size = parseInt(node.style.width) > 100 ? null : parseInt(node.style.width)
    const ratio = node.style.aspectRatio ?? null
    const align = node.style.marginLeft === 'auto' && node.style.marginRight === 'auto'
      ? 'center'
      : node.style.marginLeft === 'auto' ? 'right' : 'left'
    const link = node.querySelector<HTMLLinkElement>('a.editor-image-node-link')
    return {
      src,
      size,
      align,
      ratio,
      href: link?.href ?? null
    }
  },
  contentElement: 'figcaption.editor-image-node-title'
})

export const imageSchema = (options: { content: string, group: string }): NodeSpec => ({
  attrs: {
    src: {},
    ratio: { default: null },
    size: { default: null },
    align: { default: 'center' }, // left | center | right
    href: { default: null }
  },
  content: options.content,
  marks: '',
  group: options.group,
  selectable: true,
  parseDOM: [
    {
      tag: 'img[src]',
      getAttrs(dom) {
        if (typeof dom === 'string') return false
        return {
          src: dom.getAttribute('src'),
          title: dom.getAttribute('title') || dom.getAttribute('alt')
        }
      }
    },
    parseImageViewRule()
  ],
  toDOM: node => toDOMRender(node, ImageView)
})

/**
 * selection 在图片的标题栏时，在图片后添加一个新的节点
 * @param imageNode 
 * @returns 
 */
export const addBlockAfterImage = (imageNode: NodeType): Command => {
  return (state, dispatch) => {
    const { selection } = state
    if (!(selection instanceof TextSelection)) return false
    if (selection.$from.node(-1).type === imageNode) {
      const { $from } = selection
      const contentMatch = $from.node(-2).contentMatchAt($from.indexAfter(-1))
      const defaultBlock = defaultBlockAt(contentMatch)
      if (defaultBlock) {
        const tr = state.tr
        const pos = $from.after(-1)
        tr.insert(pos, defaultBlock.createAndFill()!)
          .setSelection(TextSelection.create(tr.doc, pos + 1))
        if (dispatch) {
          dispatch(tr.scrollIntoView())
        }
        return true
      }
    }
    return false
  }
}

export const markdownSerialize = (state: MarkdownSerializerState, node: Node, parent: Node, index: number) => {
  const image = `![${state.esc(node.textContent)}](${node.attrs.src}#align-${node.attrs.align} ${JSON.stringify(node.textContent)})`
  const linkImage = node.attrs.href ? `[${image}](${node.attrs.href || ''})` : image
  state.write(linkImage)
  state.ensureNewLine()
}