import { toolbarPlugin } from './toolbar/toolbar'
import { history, redo, undo } from 'prosemirror-history'
import { keymap } from 'prosemirror-keymap'
import { baseKeymap, chainCommands, createParagraphNear, deleteSelection, joinBackward, liftEmptyBlock, newlineInCode, selectNodeBackward, splitBlock } from 'prosemirror-commands'
import { dropCursor } from 'prosemirror-dropcursor'
import { gapCursor } from 'prosemirror-gapcursor'
import type { Schema } from 'prosemirror-model'
import { buildKeymap } from './keymap'
import { blockSelector } from './blockSelector'
import { buildInputRules } from './inputrules'
import { vueNodeViews } from './vueNodeViews'
import ImageNodeView from '../nodeViews/ImageView.vue'
import { addBlockAfterImage } from '../nodes/image'
import { addNewTodoAfterTodo, todoPlugin, toggleToParagraph } from '../nodes/todo'
import { undoInputRule } from 'prosemirror-inputrules'
import { codeViewPlugin } from '../nodeViews/CodeView'
import { blockTool } from './blockTool'
import { appendParagraph } from './appendParagraph'
import DetailsView from '../nodeViews/DetailsView.vue'
import CalloutView from '../nodeViews/CalloutView.vue'
import { addBlockAfterDetails, detailsPlugin } from '../nodes/details'
import { uploadSymbol } from '../const'
import { emojiPlugin } from './emoji/emoji'
import KatexBlockView from '../nodeViews/KatexBlockView.vue'
import TocView from '../nodeViews/TocView.vue'
import ExcalidrawView from '../nodeViews/ExcalidrawView.vue'
import { pastePlugin } from './paste'

export const createPlugins = (schema: Schema, props: {
  [uploadSymbol]?: ((file: File, options?: { previous?: string }) => Promise<string>);
  editable?: boolean
}) => [
  todoPlugin(schema.nodes.todo),
  detailsPlugin(schema.nodes.details),
  vueNodeViews(schema, props, {
    image: ImageNodeView,
    inline_image: ImageNodeView,
    details: DetailsView,
    callout: CalloutView,
    katex_block: KatexBlockView,
    toc: TocView,
    excalidraw: ExcalidrawView,
  }),
  codeViewPlugin(),
  ...(props.editable ? [
    keymap({
      'Enter': chainCommands(
        addBlockAfterImage(schema.nodes.image),
        addNewTodoAfterTodo(schema.nodes.todo, schema.nodes.list_item),
        addBlockAfterDetails(schema.nodes.details_summary)
      ),
      'Shift-Enter': chainCommands(newlineInCode, createParagraphNear, liftEmptyBlock, splitBlock),
      'Backspace': chainCommands(undoInputRule, toggleToParagraph(schema.nodes.todo), deleteSelection, joinBackward, selectNodeBackward),
      'Mod-z': undo,
      'Shift-Mod-z': redo
    }),
    keymap(buildKeymap(schema)),
    keymap(baseKeymap),
    buildInputRules(schema),
    history(),
    dropCursor({ color: '#f00' }),
    gapCursor(),
    toolbarPlugin(),
    blockSelector(),
    emojiPlugin(),
    appendParagraph(schema.nodes.paragraph),
    blockTool([
      schema.nodes.list_item,
      schema.nodes.image,
      schema.nodes.paragraph,
      schema.nodes.details,
      schema.nodes.heading,
      schema.nodes.horizontal_rule,
      schema.nodes.blockquote,
      schema.nodes.code_block,
      schema.nodes.katex_block,
      schema.nodes.callout,
      schema.nodes.toc,
      schema.nodes.excalidraw
    ]),
    pastePlugin({ imageNode: schema.nodes.image, upload: props[uploadSymbol] })
  ] : []),
]
