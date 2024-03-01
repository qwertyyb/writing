// crel 就是个 createElement 的缩写，用来创建 dom 元素的，感兴趣的可以看看源码就几十行
import crel from 'crelt'
import { EditorState, Plugin, Transaction } from 'prosemirror-state'
import { EditorView } from 'prosemirror-view'
import { isMarkActive, toggleMark } from './mark';
import type { MarkType } from 'prosemirror-model';

// 抽象 menu 的定义，不要每次都定义很多 html
/**
 * const btn = document.createElement('button')
 * btn.classList.add('is-active') // 当前 btn 激活
 * btn.classList.add('is-disabled') // 当前 btn 禁用
 * btn.onClick = fn // 点击 btn 后的效果
 * 
 * update btn style
 */

export interface ToolbarItemSpec {
  class?: string;
  label: string;
  handler: (
    props: {
      view: EditorView;
      state: EditorState;
      tr: Transaction;
      dispatch: EditorView['dispatch'];
    }, 
    event: MouseEvent
  ) => void;
  update?: (view: EditorView, state: EditorState, menu: HTMLElement) => void;
}

export class ToolbarItem {
  constructor(private view: EditorView, private spec: ToolbarItemSpec) {
    const _this = this;
    // 创建 button
    const btn = crel('button', { 
      class: ['toolbar-item', spec.class].filter(i => i).join(' '), 
      // 绑定点击事件，点击按钮时要执行的函数
      onclick(this, event: MouseEvent) {
        // 把 view state 等内容传过去，因为点击按钮的时候不是增加一个node，就是要设置 mark
        spec.handler({
          view: _this.view,
          state: _this.view.state,
          dispatch: _this.view.dispatch,
          tr: _this.view.state.tr
        }, event)
      }
    })

    btn.classList.add('menu-item')

    btn.innerText = spec.label;

    // 将 btn 绑定在当前组件上
    this.dom = btn;
  }

  dom: HTMLElement;
  
  // 定义一个 update 更新方法，在编辑器有更新的时候就调用
  update(view: EditorView, state: EditorState) {
    this.view = view;
    this.spec.update?.(view, state, this.dom)
  }
}

export interface ToolbarGroupSpec {
  name?: string;
  class?: string;
  items: ToolbarItemSpec[];
}

export class ToolbarGroup {
  constructor(private view: EditorView, public spec: ToolbarGroupSpec) {
    // 创建一个 div
    const dom = crel('div', { class: this.spec.class })
    dom.classList.add('toolbar-group')

    // 将 dom 保存在 MenuGroup 实例属性上
    this.dom = dom;
    // 通过传递的 menus 配置项，批量创建 menu
    this.menus = spec.items.map((itemSpec) => new ToolbarItem(this.view, itemSpec))

    // 最后将 menu 对应的 dom 添加到 menuGroup 的 dom 中
    this.menus.forEach(menu => {
      dom.appendChild(menu.dom)
    })
  }

  private menus: ToolbarItem[]
  
  dom: HTMLElement;

  // 定义一个 update, 主要用来批量更新 menu 的 update
  update(view: EditorView, state: EditorState) {
    this.view = view;
    this.menus.forEach(menu => {
      menu.update(view, state)
    })
  }

  hide(hidden: boolean) {
    this.dom.style.display = hidden ? 'none' : ''
  }
}

export interface ToolbarSpec {
  groups: ToolbarGroupSpec[]
  class?: string
}

export class Toolbar {
  constructor(private view: EditorView, private spec: ToolbarSpec) {
    // 定义一个 toolbar dom
    const toolbarDom = crel('div', { spec: this.spec.class })
    toolbarDom.classList.add('toolbar');

    // 将 dom 保存在 Toolbar 实例属性中
    this.dom = toolbarDom;

    // 批量创建 menuGroup
    this.groups = this.spec.groups.map(groupSpec => new ToolbarGroup(this.view, groupSpec))
    
    // 把 menuGroup 分别加入到 toolbar 中
    this.groups.forEach(group => {
      this.dom.appendChild(group.dom)
    })

    this.render();
  }

  group(name: string) {
    this.groups.forEach(group => {
      group.hide(name !== group.spec.name)
    })
  }

  // 这个 render 比较特殊，我们可以通过 view.dom 获取到 Prosemirror 编辑器挂载的 dom
  // 之后获取到它的父节点，将 toolbar 塞到 编辑器节点的前面去：这里先将 view.dom 替换成 toolbar 再把 view.dom append 上去
  // 你也可以直接用 insertBefore 之类的 api 
  render() {
    if (this.view.dom.parentNode) {
      const parentNode = this.view.dom.parentNode;
      const editorViewDom = parentNode.replaceChild(this.dom, this.view.dom);
      parentNode.appendChild(editorViewDom)
    }
  }

  groups: ToolbarGroup[]

  dom: HTMLElement;
  // 定义 update,主要用来批量更新 MenuGroup 中的 update
  update(view: EditorView, lastState: EditorState) {
    this.view = view;
    const { from, to, empty } = view.state.selection
    if (empty) {
      this.dom.style.display = 'none'
      return
    }
    let hasTextBlock = false
    let hasImageBlock = false
    view.state.doc.nodesBetween(from, to, (node, pos, parent) => {
      if (node.isTextblock) {
        hasTextBlock = true
      } else if (node.type === view.state.schema.nodes.image) {
        hasImageBlock = true
      }
    })
    if (hasTextBlock) {
      this.group('text')
    } else if (hasImageBlock) {
      this.group('image')
    }
    if (!hasTextBlock && !hasImageBlock) {
      this.dom.style.display = 'none'
      return
    }
    this.dom.style.display = 'block'
    // 这些是在屏幕上的坐标信息
    const start = view.coordsAtPos(from), end = view.coordsAtPos(to)
    // 将 tooltip 所在的父级节点作为参照系
    const box = this.dom.offsetParent!.getBoundingClientRect()
    // 寻找 tooltip 的中点，当跨行的时候，端点可能更靠近左侧
    const left = (start.left + end.right) / 2
    this.dom.style.position = 'absolute'
    this.dom.style.left = (left - box.left) + "px"
    this.dom.style.bottom = (box.bottom - start.top + 6) + "px"
    this.groups.forEach(group => {
      group.update(this.view, lastState);
    })
  }
}

const updateDOM = (view: EditorView, dom: HTMLElement, markType: string) => {
  // 编辑器更新时，判断是当前选区内容是否已经设置为 bold, 根据条件，为 menu 增加 is-active 类
  const isActive = isMarkActive(view, markType)
  if (isActive && !dom.classList.contains('is-active')) {
    dom.classList.add('is-active')
  }

  if (!isActive && dom.classList.contains('is-active')) {
    dom.classList.remove('is-active')
  }
}


export const toolbar = () => {
  return new Plugin({
    view(view) {
      return new Toolbar(view, {
        groups: [
          {
            name: 'text',
            items: [
              {
                label: 'B',
                class: 'bold',
                update(view, state, dom) {
                  updateDOM(view, dom, 'strong')
                },
                handler(props, event) {
                  toggleMark(props.view, props.view.state.schema.marks.strong)
                  props.view.focus();
                },
              },
              {
                label: 'I',
                class: 'italic',
                update(view, state, dom) {
                  updateDOM(view, dom, 'em')
                },
                handler(props, event) {
                  toggleMark(props.view, props.view.state.schema.marks.em)
                  props.view.focus();
                },
              },
              {
                label: 'Link',
                class: 'link',
                update(view, state, dom) {
                  updateDOM(view, dom, 'link')
                },
                handler(props, event) {
                  toggleMark(props.view, props.view.state.schema.marks.link)
                  props.view.focus();
                },
              },
              {
                label: 'code',
                class: 'code',
                update(view, state, dom) {
                  updateDOM(view, dom, 'icode')
                },
                handler(props, event) {
                  toggleMark(props.view, props.view.state.schema.marks.icode)
                  props.view.focus();
                },
              }
            ]
          },
          {
            name: 'image',
            items: [
              {
                label: 'Left',
                class: 'align-left',
                handler(props, event) {
                  const { from } = props.view.state.selection
                  props.dispatch(props.tr.setNodeAttribute(from, 'align', 'Left'))
                },
              },
              {
                label: 'Center',
                class: 'align-center',
                handler(props, event) {
                  const { from } = props.view.state.selection
                  props.dispatch(props.tr.setNodeAttribute(from, 'align', 'Center'))
                },
              },
              {
                label: 'Right',
                class: 'align-right',
                handler(props, event) {
                  const { from } = props.view.state.selection
                  props.dispatch(props.tr.setNodeAttribute(from, 'align', 'Right'))
                },
              },
              {
                label: '25',
                class: 'size-25',
                handler(props, event) {
                  const { from } = props.view.state.selection
                  props.dispatch(props.tr.setNodeAttribute(from, 'size', 25))
                },
              },
              {
                label: '50',
                class: 'size-50',
                handler(props, event) {
                  const { from } = props.view.state.selection
                  props.dispatch(props.tr.setNodeAttribute(from, 'size', 50))
                },
              },
              {
                label: '75',
                class: 'size-75',
                handler(props, event) {
                  const { from } = props.view.state.selection
                  props.dispatch(props.tr.setNodeAttribute(from, 'size', 75))
                },
              },
              {
                label: '100',
                class: 'size-100',
                handler(props, event) {
                  const { from } = props.view.state.selection
                  props.dispatch(props.tr.setNodeAttribute(from, 'size', 100))
                },
              }
            ]
          }
        ]
      })
    }
  })
}