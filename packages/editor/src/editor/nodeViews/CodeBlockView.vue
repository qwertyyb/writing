<template>
  <div class="code-view" data-prosemirror-dom>
    <el-tooltip effect="light" trigger="click">
      <div class="code-view-language">
        {{ node.attrs.language }}
        <span class="material-symbols-outlined">
        keyboard_arrow_down
        </span>
      </div>
      <template #content>
        <el-select style="width:200px"
          filterable
          :model-value="node.attrs.language"
          @update:model-value="languageChangeHandler"
        >
          <el-option
            :value="lang.name"
            :label="lang.name"
            v-for="lang in languages"
            :key="lang.name"
          ></el-option>
        </el-select>
      </template>
    </el-tooltip>
    <div class="code-view-codemirror" ref="dom"></div>
  </div>
</template>

<script setup lang="ts">
import {
  EditorView as CodeMirror,
  ViewUpdate,
  keymap as cmKeymap,
  drawSelection,
  lineNumbers,
  type KeyBinding
} from '@codemirror/view'
import { defaultKeymap } from '@codemirror/commands'
import { LanguageDescription } from '@codemirror/language'

import { exitCode } from 'prosemirror-commands'
import { undo, redo } from 'prosemirror-history'
import type { Node } from 'prosemirror-model'
import { Selection, TextSelection } from 'prosemirror-state'
import { Compartment } from '@codemirror/state'
import { languages } from '@codemirror/language-data'
import { oneDark } from '@codemirror/theme-one-dark'
import { onMounted, onUnmounted, ref } from 'vue'
import type { VueNodeViewProps } from '@/editor/plugins/vueNodeViews'
import { ElTooltip, ElSelect, ElOption } from 'element-plus'

const props = defineProps<VueNodeViewProps>()

let cm: CodeMirror
const dom = ref<HTMLElement>()
let updating: boolean
const languageConfig = new Compartment()

onMounted(() => {
  cm = new CodeMirror({
    parent: dom.value,
    doc:  props.node.textContent,
    extensions: [
      lineNumbers(),
      cmKeymap.of([...codeMirrorKeymap(), ...defaultKeymap]),
      drawSelection(),
      languageConfig.of([]),
      CodeMirror.updateListener.of((update) => forwardUpdate(update)),
      oneDark
    ]
  })
  updating = false
  languageChangeHandler(props.node.attrs.language)
})

const languageChangeHandler = (value: string) => {
  if (!value)
    return cm.dispatch({
      effects: languageConfig.reconfigure([])
    })
  const matched = LanguageDescription.matchLanguageName(languages, value)
  if (!matched) {
    return cm.dispatch({
      effects: languageConfig.reconfigure([])
    })
  }
  matched.load().then((support) => {
    cm.dispatch({
      effects: languageConfig.reconfigure(support)
    })
  })
  if (props.view && props.getPos && value !== props.node.attrs.language) {
    props.view.dispatch(props.view.state.tr.setNodeAttribute(props.getPos(), 'language', value))
  }
}

const forwardUpdate = (update: ViewUpdate) => {
  if (updating || !cm.hasFocus || !props.getPos || !props.view) return
  let offset = (props.getPos() || 0) + 1
  const { main } = update.state.selection
  const selFrom = offset + main.from,
    selTo = offset + main.to
  const pmSel = props.view.state.selection
  if (update.docChanged || pmSel.from != selFrom || pmSel.to != selTo) {
    const tr = props.view.state.tr
    update.changes.iterChanges((fromA, toA, fromB, toB, text) => {
      if (text.length)
        tr.replaceWith(offset + fromA, offset + toA, props.view!.state.schema.text(text.toString()))
      else tr.delete(offset + fromA, offset + toA)
      offset += toB - fromB - (toA - fromA)
    })
    tr.setSelection(TextSelection.create(tr.doc, selFrom, selTo))
    props.view.dispatch(tr)
  }
}

const codeMirrorKeymap = (): KeyBinding[] => {
  const view = props.view
  if (!view) return []
  return [
    { key: 'ArrowUp', run: () => maybeEscape('line', -1) },
    { key: 'ArrowLeft', run: () => maybeEscape('char', -1) },
    { key: 'ArrowDown', run: () => maybeEscape('line', 1) },
    { key: 'ArrowRight', run: () => maybeEscape('char', 1) },
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

const maybeEscape = (unit: 'line' | 'char', dir: -1 | 1) => {
  if (!props.getPos || !props.view) return false
  const { state } = cm
  let main: typeof state.selection.main | ReturnType<typeof state.doc.lineAt> =
    state.selection.main
  if (!main.empty) return false
  if (unit == 'line') main = state.doc.lineAt(main.head)
  if (dir < 0 ? main.from > 0 : main.to < state.doc.length) return false
  const targetPos = (props.getPos() || 0) + (dir < 0 ? 0 : props.node.nodeSize)
  const selection = Selection.near(props.view.state.doc.resolve(targetPos), dir)
  const tr = props.view.state.tr.setSelection(selection).scrollIntoView()
  props.view.dispatch(tr)
  props.view.focus()
  return true
}

onUnmounted(() => {
  cm.destroy()
})

defineExpose({
  setSelection(anchor: number, head: number) {
    cm.focus()
    updating = true
    cm.dispatch({ selection: { anchor, head } })
    updating = false
  },
  selectNode() {
    cm.focus()
  },
  stopEvent() {
    return true
  },
  update(node: Node) {
    if (updating) return true
    const newText = node.textContent,
      curText = cm.state.doc.toString()
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
      updating = true
      cm.dispatch({
        changes: {
          from: start,
          to: curEnd,
          insert: newText.slice(start, newEnd)
        }
      })
      updating = false
    }
    if (props.node.attrs.language !== node.attrs.language) {
      languageChangeHandler(node.attrs.language)
    }
    return true
  }
})
</script>

<style lang="less" scoped>
.code-view {
  background:#282c34;
  border-radius: 3px;
  overflow: hidden;
  .code-view-language {
    color: #fff;
    font-weight: bold;
    padding-left: 8px;
    font-size: 14px;
    width: fit-content;
    cursor: pointer;
    display: flex;
    align-items: center;
  }
}
</style>