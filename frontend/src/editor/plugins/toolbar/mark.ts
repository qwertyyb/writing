import type { Attrs, MarkType, Schema } from "prosemirror-model";
import { TextSelection } from "prosemirror-state";
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
function setMark(view: EditorView, markType: MarkType | string, attrs: Attrs | null = null) {
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
function unsetMark(view: EditorView, markType: MarkType | string) {
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