import { Plugin, TextSelection } from "prosemirror-state"
import EmojiSelector from "./EmojiSelector.vue"
import { createVuePluginView } from "../../utils/vuePluginView"

const MAX_QUERY_LENGTH = 10
const MIN_QUERY_LENGTH = 2
const EMOJI_TRIGGER = ':'

export const emojiPlugin = () => {
  return new Plugin({
    view(view) {
      return createVuePluginView(
        EmojiSelector,
        view,
        (view) => {
          const selection = view.state.selection
          if (selection instanceof TextSelection && selection.empty) {
            const inCode = selection.$to.parent.type.spec.code
            if (inCode) return {
              visible: false,
              query: '',
              position: { top: 0, left: 0 },
            }
            const prevText = selection.$to.parent.textBetween(Math.max(0, selection.$to.parentOffset - MAX_QUERY_LENGTH), selection.$to.parentOffset)
            const lastIndex = prevText.lastIndexOf(EMOJI_TRIGGER)
            if (lastIndex === -1) return {
              visible: false,
              query: '',
              position: { top: 0, left: 0 }
            }
            const query = prevText.substring(lastIndex + 1)
            if (query.length < MIN_QUERY_LENGTH || !/^\w+$/.test(query)) {
              return {
                visible: false,
                query: '',
                position: { top: 0, left: 0 }
              }
            }
            const rect = view.coordsAtPos(selection.to)
            const editorRect = view.dom.offsetParent!.getBoundingClientRect()
            return {
              visible: true,
              query,
              position: { top: rect.bottom - editorRect.top, left: rect.right - editorRect.left }
            }
          }
          return {
            visible: false,
            query: '',
            position: { top: 0, left: 0 }
          }
        },
        'after'
      )
    },
  })
}