import { NodeSelection, Plugin, type PluginView } from 'prosemirror-state'
import { EditorView } from 'prosemirror-view'
import { allowMarkTypes, getRangeMarks, setMark, toggleMark, unsetMark } from './mark';
import { type App, createApp, reactive, h, markRaw, toRaw } from 'vue';
import EditorToolbar, { type ToolbarItemSpec } from './EditorToolbar.vue'
import type { Mark, Node } from 'prosemirror-model';

const toolbar: ToolbarItemSpec[] = [
  {
    name: 'strong',
    title: '加粗',
    label: 'format_bold',
    handler(view) {
      toggleMark(view, view.state.schema.marks.strong)
    },
  },
  {
    name: 'em',
    title: '斜体',
    label: 'format_italic',
    handler(view) {
      toggleMark(view, view.state.schema.marks.em)
    },
  },
  {
    name: 'underline',
    title: '下划线',
    label: 'format_underlined',
    handler(view) {
      toggleMark(view, view.state.schema.marks.underline)
    },
  },
  {
    name: 'del',
    title: '删除线',
    label: 'format_strikethrough',
    handler(view) {
      toggleMark(view, view.state.schema.marks.del)
    },
  },
  {
    name: 'super',
    title: '上标',
    label: 'superscript',
    handler(view) {
      toggleMark(view, view.state.schema.marks.super)
    },
  },
  {
    name: 'sub',
    title: '下标',
    label: 'subscript',
    handler(view) {
      toggleMark(view, view.state.schema.marks.sub)
    },
  },
  {
    name: 'code',
    title: '代码',
    label: 'code',
    handler(view) {
      toggleMark(view, view.state.schema.marks.code)
    },
  },
  {
    name: 'link',
    title: '链接',
    label: 'link',
    handler(view, marksValues, value?: string | null | { href: string }) {
      if (!value || typeof value === 'object' && !value.href) {
        const start = view.state.selection.$from.start()
        const end = view.state.selection.$from.end()
        view.dispatch(view.state.tr.removeMark(start, end, view.state.schema.marks.link))
        return
      }
      if (typeof value === 'string') return;
      setMark(view, view.state.schema.marks.link, toRaw(value))
    },
  },
  {
    name: 'color',
    title: '字体颜色',
    label: 'format_color_text',
    handler(view, marksValues, color) {
      setMark(view, view.state.schema.marks.color, { color })
    },
  },
  {
    name: 'backgroundColor',
    title: '背景颜色',
    label: 'format_color_fill',
    handler(view, marksValues, color) {
      setMark(view, view.state.schema.marks.backgroundColor, { backgroundColor: color })
    },
  }
]

const linkToolbar: ToolbarItemSpec[] = [
  {
    name: 'viewLink',
    label: 'open_in_new',
    title: '打开链接',
    handler(view, marksValues) {
      window.open(marksValues.link.attrs.href)
    },
  },
  {
    name: 'link',
    label: 'link',
    title: '修改链接',
    handler(view, marksValues, value) {
      if (!value || typeof value === 'string') return;
      let content: Node | null = null
      let from: number = view.state.selection.from;
      const start = view.state.selection.$from.start()
      view.state.selection.$from.node().content.forEach((node, offset) => {
        if (start + offset <= view.state.selection.from && view.state.selection.from < start + offset + node.nodeSize) {
          content = node
          from = start + offset
        }
      })
      if (!content) return;
      view.dispatch(view.state.tr.addMark(from, from + (content as Node).nodeSize, view.state.schema.mark('link', toRaw(value))))
    }
  },
  {
    name: 'cancelLink',
    label: 'link_off',
    title: '取消链接',
    handler(view) {
      const start = view.state.selection.$from.start()
      const end = view.state.selection.$from.end()
      view.dispatch(view.state.tr.removeMark(start, end, view.state.schema.marks.link))
    }
  },
]

class ToolbarView implements PluginView {
  vm: App
  vmProps = reactive({
    editorView: null as EditorView | null,
    toolbar: markRaw(toolbar),
    marksValues: {},
    visible: false,
    position: { left: 0, top: 0 }
  })

  constructor(view: EditorView) {
    this.vmProps.editorView = markRaw(view)
    this.vm = createApp({
      render: () => h(EditorToolbar, this.vmProps as any)
    })
    const root = document.createElement('div')
    view.dom.parentNode?.appendChild(root)
    this.vm.mount(root)
  }

  update(view: EditorView) {
    const { selection, doc, schema } = view.state
    const { from, to, empty, head } = selection
    if (empty) {
      const marksValues = selection.$from.marks().reduce<Record<string, Mark>>((acc, mark) => ({ ...acc, [mark.type.name]: mark }), {})
      if (marksValues.link) {
        this.vmProps.visible = true
        this.vmProps.toolbar = markRaw(linkToolbar)
        this.vmProps.marksValues = markRaw(marksValues)
        const curPos = view.coordsAtPos(from)
        const box = view.dom.parentElement!.offsetParent!.getBoundingClientRect()
        this.vmProps.position = { left: curPos.left - box.left, top: curPos.top - box.top }
        return
      }
      this.vmProps.visible = false
      return
    }
    const markTypes = toolbar.map(item => schema.marks[item.name]).filter(Boolean)
    const allowedMarkTypes = allowMarkTypes(from, to, doc, markTypes)

    const filteredToolbar = toolbar.filter(item => allowedMarkTypes.some(markType => markType.name === item.name))
    if (!filteredToolbar.length) {
      this.vmProps.visible = false
      return
    }
    this.vmProps.toolbar = filteredToolbar

    const marksValues = getRangeMarks(from, to, doc, allowedMarkTypes)

    this.vmProps.marksValues = markRaw(marksValues)

    const curPos = view.coordsAtPos(head)
    const box = view.dom.parentElement!.offsetParent!.getBoundingClientRect()
    this.vmProps.position = { left: curPos.left - box.left, top: curPos.top - box.top }
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