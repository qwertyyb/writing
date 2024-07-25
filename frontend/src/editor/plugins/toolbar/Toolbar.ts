import { Plugin, type PluginView } from 'prosemirror-state'
import { EditorView } from 'prosemirror-view'
import { isMarkActive, toggleMark } from './mark';
import { type App, createApp, reactive, h, markRaw } from 'vue';
import EditorToolbar, { type ToolbarItemSpec } from './EditorToolbar.vue'

const toolbar: ToolbarItemSpec[] = [
  {
    name: 'strong',
    label: 'format_bold',
    handler(view) {
      toggleMark(view, view.state.schema.marks.strong)
    },
  },
  {
    name: 'em',
    label: 'format_italic',
    handler(view) {
      toggleMark(view, view.state.schema.marks.em)
    },
  },
  {
    name: 'underline',
    label: 'format_underlined',
    handler(view) {
      toggleMark(view, view.state.schema.marks.underline)
    },
  },
  {
    name: 'del',
    label: 'format_strikethrough',
    handler(view) {
      toggleMark(view, view.state.schema.marks.del)
    },
  },
  {
    name: 'super',
    label: 'superscript',
    handler(view) {
      toggleMark(view, view.state.schema.marks.super)
    },
  },
  {
    name: 'sub',
    label: 'subscript',
    handler(view) {
      toggleMark(view, view.state.schema.marks.sub)
    },
  },
  {
    name: 'code',
    label: 'code',
    handler(view) {
      toggleMark(view, view.state.schema.marks.code)
    },
  },
  {
    name: 'link',
    label: 'link',
    handler(view) {
      
    },
  },
  {
    name: 'color',
    label: 'format_color_text',
    handler(view) {
      
    },
  },
  {
    name: 'background',
    label: 'format_color_fill',
    handler(view) {
      
    },
  }
]

class ToolbarView implements PluginView {
  vm: App
  vmProps = reactive({
    editorView: null as EditorView | null,
    toolbar: markRaw(toolbar),
    activeMarks: {},
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
    const markNames = new Set()
    view.state.doc.nodesBetween(from, to, (node) => {
      if (node.isInline) return
      markTypes.forEach(markType => {
        if (markNames.has(markType.name)) return
        const allow = node.type.allowsMarkType(markType)
        console.log(allow, node)
        if (allow) {
          markNames.add(markType.name)
        }
      })
    })

    console.log([...markNames])
    const filteredToolbar = toolbar.filter(item => markNames.has(item.name))
    if (!filteredToolbar.length) {
      this.vmProps.visible = false
      return
    }

    const activeMarks = toolbar.reduce((acc, item) => ({ ...acc, [item.name]: isMarkActive(view, item.name) }), {})
    this.vmProps.activeMarks = activeMarks

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