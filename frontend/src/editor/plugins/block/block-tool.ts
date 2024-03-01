import { logger } from "@/utils/logger";
import crelt from "crelt";
import type { Attrs, NodeType } from "prosemirror-model";
import { Plugin, Selection, TextSelection } from "prosemirror-state";
import type { EditorView } from "prosemirror-view";

interface BlockToolItemSpec {
  label: string
  keyword: string
  handler: (view: EditorView) => void
}

class BlockToolItem {
  dom: HTMLElement

  constructor(public spec: BlockToolItemSpec) {
    const dom = crelt('div', {
      class: 'block-tool-item',
    }, spec.label)
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
    this.items = specs.map(spec => new BlockToolItem(spec))

    this.items.forEach(item => dom.appendChild(item.dom))

    this.dom = dom
    this.select(0)
  }

  select(index: number) {
    this.selectedIndex = index
    this.items.filter(item => item.visible()).forEach((item, curIndex) => {
      item.select(index === curIndex)
      if (index === curIndex) {
        item.dom.scrollIntoView({ block: 'nearest' })
      }
    })
  }

  filter(value: string) {
    this.items.forEach(item => {
      const visible = item.spec.keyword.includes(value)
      item.show(visible)
    })
  }

  selectNext() {
    const length = this.items.filter(item => item.visible).length
    this.select((this.selectedIndex + 1) % length)
  }

  selectPrev() {
    const length = this.items.filter(item => item.visible).length
    this.select((this.selectedIndex - 1 + length) % length)
  }

  active(view: EditorView) {
    this.items.filter(item => item.visible())[this.selectedIndex]?.handler(view)
  }
}

class SearchInput {
  dom: HTMLInputElement

  constructor(private options: {
    change: (value: string) => void,
    arrowDown: () => void,
    arrowUp: () => void,
    escape: () => void,
    enter: () => void,
  }) {
    const dom = crelt('input', {
      class: 'block-search-input',
      autofocus: true,
      onkeydown: (event: KeyboardEvent) => {
        if (['ArrowDown', 'ArrowUp', 'Escape', 'Enter'].includes(event.key)) {
          event.preventDefault()
          event.stopImmediatePropagation()
          event.stopPropagation()
        }
        logger.i('event', event)
        if (event.key === 'ArrowDown') return options.arrowDown()
        if (event.key === 'ArrowUp') return options.arrowUp()
        if (event.key === 'Escape') return options.escape()
        if (event.key === 'Enter') return options.enter()
      },
      oninput: (event: InputEvent) => {
        options.change((event.target as HTMLInputElement).value)
      }
    }) as HTMLInputElement
    this.dom = dom
  }

  focus() {
    this.dom.focus()
  }

  clear() {
    this.dom.value = ''
    this.options.change('')
  }
}

class BlockTool {
  dom: HTMLElement
  searchInput: SearchInput
  list: BlockToolList
  view?: EditorView

  constructor(specs: BlockToolItemSpec[]) {
    const dom = crelt('div', {
      class: 'block-tool'
    })

    const input = new SearchInput({
      change: this.onChange.bind(this),
      arrowDown: this.selectNext.bind(this),
      arrowUp: this.selectPrev.bind(this),
      escape: this.hide.bind(this),
      enter: this.active.bind(this)
    })
    dom.appendChild(input.dom)
    this.searchInput = input
    const list = new BlockToolList(specs)
    dom.appendChild(list.dom)
    this.list = list

    this.dom = dom
  }

  onChange(value: string) {
    this.list.filter(value)
    this.list.select(0)
  }

  selectNext() {
    this.list.selectNext()
  }

  selectPrev() {
    this.list.selectPrev()
  }

  show(view: EditorView) {
    this.view = view
    this.searchInput.clear()
    this.dom.style.display = ''
  }

  position(x: number, y: number) {
    this.dom.style.left = x + 'px'
    this.dom.style.top = y + 'px'
    this.list.select(0)
    this.searchInput.focus()
  }

  hide() {
    this.dom.style.display = 'none'
    this.view?.focus()
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
  if (node.isTextblock && node.textContent === '/') {
    const newNodeType = schema.nodes[nodeType]
    if (!newNodeType.isTextblock) {
      const transaction = tr.replaceSelectionWith(newNodeType.create())
      view.dispatch(transaction)
    } else {
      const transaction = tr
        .setBlockType($cursor.before(), $cursor.after(), newNodeType, attrs)
      view.dispatch(transaction)
    }
  }
}

export const blockTool = () => {
  const tool = new BlockTool([
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
  ])
  return new Plugin({
    props: {
      handleKeyDown(view, event) {
        if (event.key !== '/') return false
        setTimeout(() => {
          const { selection } = view.state
          if (!(selection instanceof TextSelection)) return

          const { $cursor } = selection as TextSelection
          if (!$cursor) return

          const node = $cursor.node()
          if (node.isTextblock && node.textContent === '/') {
            tool.show(view)
            const pos = view.coordsAtPos($cursor.pos)
            view.dom.parentNode?.appendChild(tool.dom)
            const rect = tool.dom.offsetParent!.getBoundingClientRect()
            const top = pos.top - rect.top
            const left = pos.left - rect.left
            tool.position(left, top)
          }
        })
        return false
      },
    }
  })
}