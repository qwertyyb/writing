import type { NodeType, Node } from "prosemirror-model"
import { Plugin } from "prosemirror-state"
import { insertPoint } from "prosemirror-transform";

export const pastePlugin = (options: {
  upload?: ((file: File, options?: { previous?: string }) => Promise<string>);
  imageNode: NodeType,
}) => {
  return new Plugin({
    props: {
      handlePaste(view, event) {
        if (!event.clipboardData || !options.upload) return;
        const hasFiles = event.clipboardData.types.includes('Files')
        if (!hasFiles) return
        const files = Array.from(event.clipboardData.files)
        const images = files.filter(file => file.type.startsWith('image/'))
        if (!images.length) return
        // 粘贴图片
        Promise.all(images.map(async image => {
          const src = await options.upload!(image)
          const child = options.imageNode.contentMatch.defaultType?.createAndFill(null, view.state.schema.text(image.name.split('.')[0]))
          const node = options.imageNode.createAndFill({ src }, child)
          return node
        })).then(nodes => {
          const tr = view.state.tr
          nodes.forEach(node => {
            if (!node) return
            const pos = insertPoint(tr.doc, tr.selection.to, options.imageNode)
            if (pos) {
              tr.insert(pos, node)
            }
          })
          view.dispatch(tr)
        })
      },
    }
  })
}