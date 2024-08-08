import type { Attrs } from 'prosemirror-model'
import { Plugin, TextSelection, type PluginView } from 'prosemirror-state'
import type { EditorView } from 'prosemirror-view'
import BlockTools from './BlockTools.vue'
import { createApp, h, markRaw, reactive, type App } from 'vue'

const COMMAND_TRIGGER = '/'
const MAX_QUERY_LENGTH = 6

interface BlockToolItemSpec {
  label: string
  keyword: string
  handler: (view: EditorView) => void
}

const updateNodeType = (view: EditorView, nodeType: string, attrs?: Attrs) => {
  const { selection, schema, tr } = view.state
  if (!(selection instanceof TextSelection)) return

  const { $cursor } = selection as TextSelection
  if (!$cursor) return

  const node = $cursor.node()
  if (node.isTextblock) {
    const newNodeType = schema.nodes[nodeType]
    if (newNodeType.isTextblock) {
      const transaction = tr.setBlockType($cursor.before(), $cursor.after(), newNodeType, attrs)
        .deleteRange($cursor.start(), $cursor.end())
      view.dispatch(transaction)
    } else {
      const newNode = newNodeType.createAndFill()
      if (!newNode) {
        throw new Error(`updateNodeType failed: ${nodeType}`)
      }
      const transaction = tr.replaceRangeWith($cursor.before(), $cursor.after(), newNode)
      view.dispatch(transaction.setSelection(TextSelection.near(tr.doc.resolve($cursor.before() + 1), 1)))
    }
  }
}

const blocks: BlockToolItemSpec[] = [
  {
    label: '文本',
    keyword: 'text',
    handler(view) {
      updateNodeType(view, 'paragraph')
    }
  },
  {
    label: '标题1',
    keyword: 'h1',
    handler(view) {
      updateNodeType(view, 'heading', { level: 1 })
    }
  },
  {
    label: '标题2',
    keyword: 'h2',
    handler(view) {
      updateNodeType(view, 'heading', { level: 2 })
    }
  },
  {
    label: '标题3',
    keyword: 'h3',
    handler(view) {
      updateNodeType(view, 'heading', { level: 3 })
    }
  },
  {
    label: '图片',
    keyword: 'image',
    handler(view) {
      updateNodeType(view, 'image')
    }
  },
  {
    label: '有序列表',
    keyword: 'ordered-list',
    handler(view) {
      updateNodeType(view, 'ordered_list')
    }
  },
  {
    label: '无序列表',
    keyword: 'unordered-list',
    handler(view) {
      updateNodeType(view, 'bullet_list')
    }
  },
  {
    label: '代码块',
    keyword: 'code',
    handler(view) {
      updateNodeType(view, 'code_block')
    }
  },
  {
    label: '引用',
    keyword: 'quote',
    handler(view) {
      updateNodeType(view, 'blockquote')
    }
  },
  {
    label: '分隔线',
    keyword: 'divider',
    handler(view) {
      updateNodeType(view, 'divider')
    }
  },
  {
    label: '折叠内容',
    keyword: 'details',
    handler(view) {
      updateNodeType(view, 'details')
    }
  },
  {
    label: 'Callout',
    keyword: 'callout',
    handler(view) {
      updateNodeType(view, 'callout')
    },
  }
]

class BlockTool implements PluginView {
  vm: App
  vmProps = reactive({
    blocks: markRaw(blocks),
    editorView: null as EditorView | null,
    keyword: '',
    position: { top: 0, left: 0 },
    visible: false,
    onClose: () => {
      this.vmProps.visible = false
    }
  })

  constructor(editorView: EditorView) {
    this.vmProps.editorView = markRaw(editorView)
    const vm = createApp({
      render: () => h(BlockTools, this.vmProps as any)
    })
    const dom = document.createElement('div')
    editorView.dom.parentNode?.appendChild(dom)
    vm.mount(dom)
    this.vm = vm
  }

  update(view: EditorView) {
    const selection = view.state.selection
    if (!(selection instanceof TextSelection)) return
    const cursor = selection.$cursor
    if (!cursor) return

    const text = cursor.parent.textContent
    if (text.startsWith(COMMAND_TRIGGER) && text.length < MAX_QUERY_LENGTH) {
      // 输入的字符位于首位，显示 command 列表
      const pos = view.coordsAtPos(selection.$cursor.pos)
      const rect = view.dom.offsetParent!.getBoundingClientRect()
      const top = pos.bottom - rect.top
      const left = pos.left - rect.left
      this.vmProps.keyword = text.substring(1),
      this.vmProps.visible = true,
      this.vmProps.position = { top, left }
      this.vmProps.editorView = markRaw(view)
    } else {
      this.vmProps.visible = false
    }
  }

  destroy() {
    this.vm.unmount()
  }
}

export const blockTool = () => {
  return new Plugin({
    view(editorView) {
      const blockTool = new BlockTool(editorView)
      return blockTool
    },
  })
}
