import { InputRule } from "prosemirror-inputrules";
import { Fragment, Slice, type NodeSpec, type NodeType } from "prosemirror-model";
import { ReplaceAroundStep } from "prosemirror-transform";

export const todoItem: NodeSpec = {
  group: 'group_list_item',
  attrs: {
    checked: { default: false }
  },
  defining: true,
  content: 'block+',
  toDOM() { return ['li', { class: 'todo-item' }, 0] }
}

export function todoItemInputRule(nodeType: NodeType) {
  return new InputRule(/^\[\s\]$/, (state, match, start, end) => {
    const $start = state.doc.resolve(start)
    if (!$start.node(-2).canReplaceWith($start.index(-1), $start.indexAfter(-1), nodeType)) return null
    const fr = Fragment.from(nodeType.create())
    
    return state.tr
      .step(new ReplaceAroundStep(
        $start.before(-1),
        $start.after(-1),
        $start.start(-1),
        $start.end(-1),
        new Slice(fr, 0, 0),
        1
      ))
      .delete(start, end)
  })
}