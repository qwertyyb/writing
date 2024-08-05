import type { ContentMatch, Node, NodeType } from "prosemirror-model";
import { toDOMRender } from "../plugins/vueNodeViews";
import ImageView from "../node-views/ImageView.vue";
import { TextSelection, type Command } from "prosemirror-state";

function defaultBlockAt(match: ContentMatch) {
  for (let i = 0; i < match.edgeCount; i++) {
    const {type} = match.edge(i)
    if (type.isTextblock && !type.hasRequiredAttrs()) return type
  }
  return null
}

export const toImageNode = (node: Node) => {
  return toDOMRender(node, ImageView)
}

export const parseImageNode = () => ({
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

/**
 * selection 在图片的标题栏时，在图片后添加一个新的节点
 * @param imageNode 
 * @returns 
 */
export const addBlockAfterImageNode = (imageNode: NodeType): Command => {
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