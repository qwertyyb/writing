import { InputRule } from "prosemirror-inputrules";
import { Fragment, Slice, type NodeSpec, type NodeType } from "prosemirror-model";
import { Plugin, TextSelection, type Command } from "prosemirror-state";
import { ReplaceAroundStep } from "prosemirror-transform";

export const todo: NodeSpec = {
  group: 'todo_block',
  attrs: {
    checked: { default: false }
  },
  defining: true,
  content: 'block+',
  parseDOM: [
    {
      tag: 'li.todo-item',
      getAttrs(node) {
        if (typeof node === 'string') return false
        const checkbox = node.querySelector<HTMLInputElement>('.todo-item-content > input[type="checkbox"]')
        if (!checkbox) return false
        return {
          checked: checkbox.checked
        }
      },
      contentElement: '.todo-item-content > .todo-content'
    }
  ],
  toDOM(node) {
    const wrapper = document.createElement('div')
    wrapper.className = 'todo'
    wrapper.style.cssText = 'display:flex;align-items:baseline'
    const checkbox = document.createElement('input')
    checkbox.type = 'checkbox'
    checkbox.toggleAttribute('checked', node.attrs.checked)
    const contentDOM = document.createElement('div')
    contentDOM.className = 'todo-content'
    contentDOM.style.cssText = 'margin-left: 0.5em'
    wrapper.appendChild(checkbox)
    wrapper.appendChild(contentDOM)
    return {
      dom: wrapper,
      contentDOM
    }
  }
}

export const addNewTodoCommand = (nodeType: NodeType, listItemNode: NodeType): Command => {
  return (state, dispatch) => {
    if (!(state.selection instanceof TextSelection)) return false
    const { $from, empty } = state.selection
    if ($from.node(-1).type !== nodeType || !empty) return false
    if (dispatch) {
      const listItem = listItemNode.createChecked(null, nodeType.createAndFill())
      const tr = state.tr
      dispatch(
        tr.insert($from.after(-2), listItem)
          // <li>1<todo>2<p>3
          .setSelection(TextSelection.create(tr.doc, $from.after(-2) + 3))
          .scrollIntoView()
      )
    }
    
    return true
  }
}

export const toggleToParagraphCommmand = (nodeType: NodeType): Command => {
  return (state, dispatch) => {
    if (!(state.selection instanceof TextSelection)) return false
    const { $from, empty, from } = state.selection
    if ($from.node(-1).type !== nodeType || !empty) return false
    if ($from.parentOffset === 0 && $from.index(-1) === 0) {
      if (dispatch) {
        const fr = $from.node(-1).content
        const tr = state.tr
        dispatch(
          tr
            .replaceRange($from.before(-1), $from.after(-1), new Slice(fr, 0, 0))
            .setSelection(TextSelection.create(tr.doc, from - 1))
        )
      }
      return true
    }
    return false
  }
}

export const toggleTodoPlugin = (todoItemNodeType: NodeType, event = 'change') => {
  return new Plugin({
    props: {
      handleDOMEvents: {
        [event]: (view, event) => {
          if (event.target.nodeName.toLowerCase() !== 'input' || event.target.type !== 'checkbox') return
          const pos = view.posAtDOM(event.target, 0)
          const $pos = view.state.doc.resolve(pos)
          if ($pos.parent.type !== todoItemNodeType) return
          view.dispatch(view.state.tr.setNodeAttribute($pos.before(), 'checked', event.target.checked))
          return true
        }
      },
    }
  })
}