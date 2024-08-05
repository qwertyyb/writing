import { toolbarPlugin } from './toolbar/toolbar'
import { history, redo, undo } from 'prosemirror-history'
import { keymap } from 'prosemirror-keymap'
import { baseKeymap, chainCommands, createParagraphNear, deleteSelection, joinBackward, liftEmptyBlock, newlineInCode, selectNodeBackward, splitBlock } from 'prosemirror-commands'
import { dropCursor } from 'prosemirror-dropcursor'
import { gapCursor } from 'prosemirror-gapcursor'
import type { Schema } from 'prosemirror-model'
import { buildKeymap } from './keymap'
import { blockTool } from './block/block-tool'
import { buildInputRules } from './inputrules'
import { vueNodeViews } from './vueNodeViews'
import ImageNodeView from '../node-views/ImageView.vue'
import { addBlockAfterImageNode } from '../nodes/ImageNode'
import { addNewTodoCommand, toggleTodoPlugin, toggleToParagraphCommmand } from '../schema/todoList'
import { undoInputRule } from 'prosemirror-inputrules'

export const createPlugins = (schema: Schema) => [
  toggleTodoPlugin(schema.nodes.todo),
  keymap({
    'Enter': chainCommands(addBlockAfterImageNode(schema.nodes.image), addNewTodoCommand(schema.nodes.todo, schema.nodes.list_item)),
    'Shift-Enter': chainCommands(newlineInCode, createParagraphNear, liftEmptyBlock, splitBlock),
    'Backspace': chainCommands(undoInputRule, toggleToParagraphCommmand(schema.nodes.todo), deleteSelection, joinBackward, selectNodeBackward),
    'Mod-z': undo,
    'Shift-Mod-z': redo
  }),
  keymap(buildKeymap(schema)),
  keymap(baseKeymap),
  buildInputRules(schema),
  history(),
  dropCursor(),
  gapCursor(),
  toolbarPlugin(),
  blockTool(),
  vueNodeViews(schema, {
    image: ImageNodeView
  }),
]
