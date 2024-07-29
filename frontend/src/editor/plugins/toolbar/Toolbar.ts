import { Plugin, type PluginView } from 'prosemirror-state'
import { EditorView } from 'prosemirror-view'
import { allowMarkTypes, getRangeMarks, setMark, toggleMark } from './mark';
import { type App, createApp, reactive, h, markRaw } from 'vue';
import EditorToolbar, { type ToolbarItemSpec } from './EditorToolbar.vue'

const toolbar: ToolbarItemSpec[] = [
  {
    type: 'mark',
    name: 'strong',
    label: 'format_bold',
    handler(view) {
      toggleMark(view, view.state.schema.marks.strong)
    },
  },
  {
    type: 'mark',
    name: 'em',
    label: 'format_italic',
    handler(view) {
      toggleMark(view, view.state.schema.marks.em)
    },
  },
  {
    type: 'mark',
    name: 'underline',
    label: 'format_underlined',
    handler(view) {
      toggleMark(view, view.state.schema.marks.underline)
    },
  },
  {
    type: 'mark',
    name: 'del',
    label: 'format_strikethrough',
    handler(view) {
      toggleMark(view, view.state.schema.marks.del)
    },
  },
  {
    type: 'mark',
    name: 'super',
    label: 'superscript',
    handler(view) {
      toggleMark(view, view.state.schema.marks.super)
    },
  },
  {
    type: 'mark',
    name: 'sub',
    label: 'subscript',
    handler(view) {
      toggleMark(view, view.state.schema.marks.sub)
    },
  },
  {
    type: 'mark',
    name: 'code',
    label: 'code',
    handler(view) {
      toggleMark(view, view.state.schema.marks.code)
    },
  },
  {
    type: 'mark',
    name: 'link',
    label: 'link',
    handler(view) {
    },
  },
  {
    type: 'mark',
    name: 'color',
    label: 'format_color_text',
    handler(view, color) {
      setMark(view, view.state.schema.marks.color, { color })
    },
  },
  {
    type: 'mark',
    name: 'backgroundColor',
    label: 'format_color_fill',
    handler(view, color) {
      setMark(view, view.state.schema.marks.backgroundColor, { backgroundColor: color })
    },
  }
]

class ToolbarView implements PluginView {
  vm: App
  vmProps = reactive({
    editorView: null as EditorView | null,
    toolbar: markRaw(toolbar),
    marksValues: {},
    visible: false,
    position: { left: 0, bottom: 0 }
  })

  constructor(view: EditorView) {
    this.vmProps.editorView = markRaw(view)
    this.vm = createApp({
      render: () => h(EditorToolbar, this.vmProps as any)
    })
    const root = document.createElement('div')
    view.dom.parentNode?.appendChild(root)
    this.vm.mount(root)
    console.log(this.vm)
  }

  update(view: EditorView) {
    const { from, to, empty } = view.state.selection
    if (empty) {
      this.vmProps.visible = false
      return
    }
    const markTypes = toolbar.map(item => view.state.schema.marks[item.name]).filter(Boolean)
    const doc = view.state.doc
    const allowedMarkTypes = allowMarkTypes(from, to, doc, markTypes)

    const filteredToolbar = toolbar.filter(item => allowedMarkTypes.some(markType => markType.name === item.name))
    if (!filteredToolbar.length) {
      this.vmProps.visible = false
      return
    }
    this.vmProps.toolbar = filteredToolbar

    const marksValues = getRangeMarks(from, to, doc, allowedMarkTypes)

    this.vmProps.marksValues = markRaw(marksValues)

    const start = view.coordsAtPos(from), end = view.coordsAtPos(to)
    const box = view.dom.parentElement!.offsetParent!.getBoundingClientRect()
    const bottom = box.bottom - start.top
    const left = (start.left + end.right) / 2 - box.left
    this.vmProps.position = { left, bottom }
    this.vmProps.visible = true
  }

  destroy() {
    this.vm.unmount()
  }
}


export const toolbarPlugin = () => {
  return new Plugin({
    view(view) {
      return new ToolbarView(view)
    }
  })
}