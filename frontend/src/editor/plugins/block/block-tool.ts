import { logger } from '@/utils/logger'
import crelt from 'crelt'
import type { Attrs } from 'prosemirror-model'
import { Plugin, TextSelection, type PluginView } from 'prosemirror-state'
import type { EditorView } from 'prosemirror-view'

const COMMAND_TRIGGER = '/'
const MAX_QUERY_LENGTH = 6

interface BlockToolItemSpec {
  label: string
  keyword: string
  handler: (view: EditorView) => void
}

class BlockToolItem {
  dom: HTMLElement

  constructor(public spec: BlockToolItemSpec) {
    const dom = crelt(
      'div',
      {
        class: 'block-tool-item'
      },
      spec.label
    )
    this.dom = dom
  }

  select(selected: boolean) {
    this.dom.classList.toggle('selected', selected)
  }

  show(visible: boolean) {
    this.dom.classList.toggle('hidden', !visible)
  }

  visible() {
    return !this.dom.classList.contains('hidden')
  }

  handler(view: EditorView) {
    logger.i('handler', this.spec)
    this.spec.handler(view)
  }
}

class BlockToolList {
  dom: HTMLElement
  items: BlockToolItem[]

  private selectedIndex = 0

  constructor(private specs: BlockToolItemSpec[]) {
    const dom = crelt('div', {
      class: 'block-tool-list'
    })
    this.items = specs.map((spec) => new BlockToolItem(spec))

    this.items.forEach((item) => dom.appendChild(item.dom))

    this.dom = dom
    this.select(0)
  }

  select(index: number) {
    this.selectedIndex = index
    this.items
      .filter((item) => item.visible())
      .forEach((item, curIndex) => {
        item.select(index === curIndex)
        if (index === curIndex) {
          item.dom.scrollIntoView({ block: 'nearest' })
        }
      })
  }

  filter(value: string) {
    this.items.forEach((item) => {
      const visible = item.spec.keyword.includes(value)
      item.show(visible)
    })
    return this.items.filter(item => item.visible())
  }

  selectNext() {
    const length = this.items.filter((item) => item.visible).length
    this.select((this.selectedIndex + 1) % length)
  }

  selectPrev() {
    const length = this.items.filter((item) => item.visible).length
    this.select((this.selectedIndex - 1 + length) % length)
  }

  active(view: EditorView) {
    this.items.filter((item) => item.visible())[this.selectedIndex]?.handler(view)
  }
}

class BlockTool implements PluginView {
  dom: HTMLElement
  list: BlockToolList
  view: EditorView

  constructor(editorView: EditorView, specs: BlockToolItemSpec[]) {
    this.view = editorView
    const dom = crelt('div', {
      class: 'block-tool'
    })

    const list = new BlockToolList(specs)
    dom.appendChild(list.dom)
    this.list = list

    this.dom = dom
    this.hide()
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
      this.show({ left, top })
      // 把触发字符移除
      this.query(text.substring(1))
    } else {
      this.hide()
    }
  }

  private keydownHandler = (event: KeyboardEvent) => {
    if (['ArrowDown', 'ArrowUp', 'Escape', 'Enter'].includes(event.key)) {
      event.preventDefault()
      event.stopImmediatePropagation()
      event.stopPropagation()
    }
    if (event.key === 'ArrowDown') return this.selectNext()
    if (event.key === 'ArrowUp') return this.selectPrev()
    if (event.key === 'Escape') return this.query('')
    if (event.key === 'Enter') return this.active()
  }

  query(value: string) {
    const results = this.list.filter(value)
    if (!results.length) {
      this.hide()
      return
    }
    this.list.select(0)
  }

  selectNext() {
    this.list.selectNext()
  }

  selectPrev() {
    this.list.selectPrev()
  }

  show(position: { left: number, top: number }) {
    this.view.dom.removeEventListener('keydown', this.keydownHandler, true)
    this.query('')
    this.dom.style.display = ''
    this.dom.style.left = position.left + 'px'
    this.dom.style.top = position.top + 'px'
    this.list.select(0)
    this.view.dom.addEventListener('keydown', this.keydownHandler, true)
  }

  hide() {
    this.dom.style.display = 'none'
    this.view?.focus()
    this.view.dom.removeEventListener('keydown', this.keydownHandler, true)
  }

  active() {
    this.list.active(this.view!)
    this.hide()
  }
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
        .delete($cursor.before() + 1, $cursor.after() - 1)
      view.dispatch(transaction)
    } else {
      const newNode = newNodeType.createAndFill()
      if (!newNode) {
        throw new Error(`updateNodeType failed: ${nodeType}`)
      }
      const transaction = tr.replaceRangeWith($cursor.before(), $cursor.after(), newNode)
      view.dispatch(transaction)
    }
  }
}

export const blockTool = () => {
  const specs: BlockToolItemSpec[] = [
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
        updateNodeType(view, 'orderedList')
      }
    },
    {
      label: '无序列表',
      keyword: 'unordered-list',
      handler(view) {
        updateNodeType(view, 'unorderedList')
      }
    },
    {
      label: '代码块',
      keyword: 'code',
      handler(view) {
        updateNodeType(view, 'code')
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
    }
  ]
  return new Plugin({
    view(editorView) {
      const blockTool = new BlockTool(editorView, specs)
      editorView.dom.parentNode?.appendChild(blockTool.dom)
      return blockTool
    },
  })
}
