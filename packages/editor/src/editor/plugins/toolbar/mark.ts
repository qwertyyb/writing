import type { Attrs, Mark, MarkType, Node, Schema } from "prosemirror-model";
import { EditorState, TextSelection } from "prosemirror-state";
import type { EditorView } from "prosemirror-view";

// 将获取 markType 的功能封装为函数方便调用
function getMarkType(markType: MarkType | string, schema: Schema) {
  return typeof markType === 'string' ? schema.marks[markType] : markType;
}
// 判断当前 selection 是否是 文本选区，prosemirror 中除了文本选区，还有 Node 选区 NodeSelection，即当前选中的是某个 Node 节点而不是文本
function isTextSelection(selection: unknown): selection is TextSelection {
  return selection instanceof TextSelection;
}

/**
 * 设置 mark
 * 
 * @param view 
 * @param markType 
 * @param attrs 
 */
export function setMark(view: EditorView, markType: MarkType | string, attrs: Attrs | null = null) {
  const { schema, selection, tr } = view.state;
  const { $from, $to, empty } = selection;

  const realMarkType = getMarkType(markType, schema);
  const mark = realMarkType.create(attrs);

  // 光标状态，如果 storedMarks 里没有 当前 mark，就把当前 mark 加进去
  if (empty) {
    if (!realMarkType.isInSet(tr.storedMarks || [])) {
      tr.addStoredMark(mark)
    }
  } else {
    // 否则再执行之前的逻辑
    tr.addMark($from.pos, $to.pos, mark);
  }

  view.dispatch(tr);

  return true;
}

/**
 * 选区内所有的内容都被设置了 mark，那就是 active
 * 
 * @param view 
 * @param markType 
 */
export function isMarkActive(view: EditorView, markType: MarkType | string) {
  const { schema, selection, tr } = view.state;

  // 暂时规定：如果不是文本选区，就不能设置 mark
  if (!isTextSelection(selection)) {
    return false;
  }

  const { $from, $to, empty } = selection;
  
  const realMarkType = getMarkType(markType, schema);

  let isActive = true;

  // 增加 光标情况下，判断当前是否处于 markType 下
  if (empty) {
    if (!realMarkType.isInSet(tr.storedMarks || $from.marks())) {
      isActive = false;
    }
  } else {
    tr.doc.nodesBetween($from.pos, $to.pos, (node) => {
      if (!isActive) return false;
      if (node.isInline) {
        const mark = realMarkType.isInSet(node.marks)
        if (!mark) {
          isActive = false;
        }
      }
    })
  }
  

  return isActive;
}

/**
 * 取消 mark
 * 
 * @param view 
 * @param markType 
 */
export function unsetMark(view: EditorView, markType: MarkType | string) {
  const { schema, selection, tr } = view.state;
  const { $from, $to } = selection;
  
  const type = typeof markType === 'string' ? schema.marks[markType] : markType;

  tr.removeMark($from.pos, $to.pos, type);
  
  view.dispatch(tr)

  return true;
}

/**
 * toggle mark
 * 
 * @param view 
 * @param markType 
 * @returns 
 */
export function toggleMark(view: EditorView, markType: MarkType | string) {
  if (isMarkActive(view, markType)) {
    return unsetMark(view, markType)
  } else {
    return setMark(view, markType)
  }
}

export const allowMarkTypes = (from: number, to: number, node: Node, markTypes: MarkType[]) => {
  node.nodesBetween(from, to, (node) => {
    if (!node.isTextblock) return;
    markTypes = markTypes.filter(markType => {
      return node.type.allowsMarkType(markType)
    })
  })
  return markTypes
}

export const getRangeMarks = (from: number, to: number, node: Node, markTypes: MarkType[]) => {
  const marks: Record<string, Mark> = {}
  node.nodesBetween(from, to, node => {
    markTypes = markTypes.filter((markType) => {
      if (node.isInline && node.type.allowsMarkType(markType)) {
        const mark = node.marks.find(mark => mark.type === markType)
        if (!mark) {
          // 没有对应的mark, 则此 mark 不应该高亮，后续不用再查询了
          return false
        }
        if (marks[markType.name]) {
          // 当前 mark 的值与前一个 mark 的值相等，则有可能可以高亮，继续查询
          // 如果当前 mark 的值与前一个 mark 的值不相等，则此 mark 不应高亮，不需要再查询了
          return marks[markType.name].eq(mark)
        } else {
          // 把当前 mark 存下来方便后面匹配
          marks[markType.name] = mark
          return true
        }
      }
      return true
    })
  })
  return marks
}