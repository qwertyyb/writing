import {
  EditorView as CodeMirror,
  ViewUpdate,
  keymap as cmKeymap,
  drawSelection,
  type KeyBinding
} from '@codemirror/view'
import { defaultKeymap } from '@codemirror/commands'
import { LanguageDescription } from '@codemirror/language'

import { exitCode } from 'prosemirror-commands'
import { undo, redo } from 'prosemirror-history'
import type { EditorView, NodeView } from 'prosemirror-view'
import type { Node } from 'prosemirror-model'
import { Plugin, Selection, TextSelection } from 'prosemirror-state'
import { Compartment } from '@codemirror/state'
import { languages } from '@codemirror/language-data'
import { oneDark } from '@codemirror/theme-one-dark'

export class CodeBlockView implements NodeView {
  cm: CodeMirror
  dom: HTMLElement

  updating: boolean
  languageConfig = new Compartment()

  constructor(
    private node: Node,
    private view: EditorView,
    private getPos: () => number | undefined
  ) {
    // Create a CodeMirror instance
    this.cm = new CodeMirror({
      doc: this.node.textContent,
      extensions: [
        cmKeymap.of([...this.codeMirrorKeymap(), ...defaultKeymap]),
        drawSelection(),
        this.languageConfig.of([]),
        CodeMirror.updateListener.of((update) => this.forwardUpdate(update)),
        oneDark
      ]
    })

    // The editor's outer node is our DOM representation
    const dom = document.createElement('div')
    dom.classList.add('code_block_view')
    dom.style.cssText = 'position:relative;margin:1em 0;border-radius:4px;overflow:hidden'
    const select = document.createElement('select')
    select.classList.add('code-language-selector')
    select.style.cssText = 'position:absolute;top:0;right:0;bottom:0;width:200px;height:26px'
    languages.forEach(lang => {
      const option = document.createElement('option')
      option.value = lang.name
      option.textContent = lang.name
      select.appendChild(option)
    })
    select.value = node.attrs.language
    dom.appendChild(this.cm.dom)
    dom.appendChild(select)
    this.dom = dom

    // This flag is used to avoid an update loop between the outer and
    // inner editor
    this.updating = false

    this.languageChangeHandler(node.attrs.language)

    select.addEventListener('change', () => {
      this.languageChangeHandler(select.value)
    })
  }

  languageChangeHandler = (value: string) => {
    if (!value)
      return this.cm.dispatch({
        effects: this.languageConfig.reconfigure([])
      })
    const matched = LanguageDescription.matchLanguageName(languages, value)
    if (!matched) {
      return this.cm.dispatch({
        effects: this.languageConfig.reconfigure([])
      })
    }
    matched.load().then((support) => {
      this.cm.dispatch({
        effects: this.languageConfig.reconfigure(support)
      })
    })
  }

  forwardUpdate(update: ViewUpdate) {
    if (this.updating || !this.cm.hasFocus) return
    let offset = (this.getPos() || 0) + 1
    const { main } = update.state.selection
    const selFrom = offset + main.from,
      selTo = offset + main.to
    const pmSel = this.view.state.selection
    if (update.docChanged || pmSel.from != selFrom || pmSel.to != selTo) {
      const tr = this.view.state.tr
      update.changes.iterChanges((fromA, toA, fromB, toB, text) => {
        if (text.length)
          tr.replaceWith(offset + fromA, offset + toA, this.view.state.schema.text(text.toString()))
        else tr.delete(offset + fromA, offset + toA)
        offset += toB - fromB - (toA - fromA)
      })
      tr.setSelection(TextSelection.create(tr.doc, selFrom, selTo))
      this.view.dispatch(tr)
    }
  }

  setSelection(anchor: number, head: number) {
    this.cm.focus()
    this.updating = true
    this.cm.dispatch({ selection: { anchor, head } })
    this.updating = false
  }

  codeMirrorKeymap(): KeyBinding[] {
    const view = this.view
    return [
      { key: 'ArrowUp', run: () => this.maybeEscape('line', -1) },
      { key: 'ArrowLeft', run: () => this.maybeEscape('char', -1) },
      { key: 'ArrowDown', run: () => this.maybeEscape('line', 1) },
      { key: 'ArrowRight', run: () => this.maybeEscape('char', 1) },
      {
        key: 'Ctrl-Enter',
        run: () => {
          if (!exitCode(view.state, view.dispatch)) return false
          view.focus()
          return true
        }
      },
      { key: 'Ctrl-z', mac: 'Cmd-z', run: () => undo(view.state, view.dispatch) },
      { key: 'Shift-Ctrl-z', mac: 'Shift-Cmd-z', run: () => redo(view.state, view.dispatch) },
      { key: 'Ctrl-y', mac: 'Cmd-y', run: () => redo(view.state, view.dispatch) }
    ]
  }

  maybeEscape(unit: 'line' | 'char', dir: -1 | 1) {
    const { state } = this.cm
    let main: typeof state.selection.main | ReturnType<typeof state.doc.lineAt> =
      state.selection.main
    if (!main.empty) return false
    if (unit == 'line') main = state.doc.lineAt(main.head)
    if (dir < 0 ? main.from > 0 : main.to < state.doc.length) return false
    const targetPos = (this.getPos() || 0) + (dir < 0 ? 0 : this.node.nodeSize)
    const selection = Selection.near(this.view.state.doc.resolve(targetPos), dir)
    const tr = this.view.state.tr.setSelection(selection).scrollIntoView()
    this.view.dispatch(tr)
    this.view.focus()
    return true
  }

  update(node: Node) {
    if (node.type != this.node.type) return false
    this.node = node
    if (this.updating) return true
    const newText = node.textContent,
      curText = this.cm.state.doc.toString()
    if (newText != curText) {
      let start = 0,
        curEnd = curText.length,
        newEnd = newText.length
      while (start < curEnd && curText.charCodeAt(start) == newText.charCodeAt(start)) {
        ++start
      }
      while (
        curEnd > start &&
        newEnd > start &&
        curText.charCodeAt(curEnd - 1) == newText.charCodeAt(newEnd - 1)
      ) {
        curEnd--
        newEnd--
      }
      this.updating = true
      this.cm.dispatch({
        changes: {
          from: start,
          to: curEnd,
          insert: newText.slice(start, newEnd)
        }
      })
      this.updating = false
    }
    if (this.node.attrs.language !== node.attrs.language) {
      this.languageChangeHandler(node.attrs.language)
    }
    return true
  }

  selectNode() {
    this.cm.focus()
  }
  stopEvent() {
    return true
  }

  destroy() {
    this.cm.destroy()
  }
}

export const codeViewPlugin = () => {
  return new Plugin({
    props: {
      nodeViews: {
        code_block: (node, view, getPos) => new CodeBlockView(node, view, getPos)
      }
    }
  })
}
