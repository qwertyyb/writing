import { TextSelection, type Command } from "prosemirror-state"

export const removeStoredMarks = (): Command => {
  return (state, dispatch) => {
    if (!(state.selection instanceof TextSelection)) return false
    if (!state.selection.empty) return false
    const { $cursor } = state.selection
    const marks = $cursor?.marks()
    if (!$cursor || $cursor.parentOffset !== $cursor.parent.content.size || !marks?.length) return false
    const text = $cursor.parent.textBetween(Math.max(0, $cursor.parentOffset - 1), $cursor.parentOffset)
    if (text !== ' ' && text.charCodeAt(0) !== 160) return false
    const tr = state.tr.removeMark($cursor.pos - 1, $cursor.pos, marks.at(-1))
    if (dispatch) {
      dispatch(tr)
    }
    return true
  }
}