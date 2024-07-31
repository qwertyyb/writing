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
  toDOM(node) {
    const li = document.createElement('li')
    li.className = 'todo-item'
    const wrapper = document.createElement('div')
    wrapper.className = 'todo-item-content'
    wrapper.style.cssText = 'display:flex;align-items:baseline'
    const checkbox = document.createElement('input')
    checkbox.type = 'checkbox'
    checkbox.checked = node.attrs.checked
    const contentDOM = document.createElement('div')
    contentDOM.className = 'todo-content'
    contentDOM.style.display = 'inline-block'
    wrapper.appendChild(checkbox)
    wrapper.appendChild(contentDOM)
    li.appendChild(wrapper)
    return {
      dom: li,
      contentDOM
    }
  }
}

export function todoItemInputRule(nodeType: NodeType) {
  return new InputRule(/^\[(\s|x)\]$/, (state, match, start, end) => {
    const $start = state.doc.resolve(start)
    if (!$start.node(-2).canReplaceWith($start.index(-1), $start.indexAfter(-1), nodeType)) return null
    const fr = Fragment.from(nodeType.create({ checked: match[1] === 'x' }))
    
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