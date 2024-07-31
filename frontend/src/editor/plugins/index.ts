import { toolbarPlugin } from './toolbar/toolbar'
import { history, redo, undo } from 'prosemirror-history'
import { keymap } from 'prosemirror-keymap'
import { baseKeymap, chainCommands } from 'prosemirror-commands'
import { dropCursor } from 'prosemirror-dropcursor'
import { gapCursor } from 'prosemirror-gapcursor'
import type { Schema } from 'prosemirror-model'
import { buildKeymap } from './keymap'
import { blockTool } from './block/block-tool'
import { buildInputRules } from './inputrules'
import { vueNodeViews } from './vueNodeViews'
import ImageNodeView from '../node-views/ImageView.vue'
import { addBlockAfterImageNode } from '../nodes/ImageNode'
import { splitListItem } from 'prosemirror-schema-list'

export const createPlugins = (schema: Schema) => [
  keymap({
    'Enter': chainCommands(addBlockAfterImageNode(schema.nodes.image), splitListItem(schema.nodes.todo_item))
  }),
  keymap(buildKeymap(schema)),
  keymap(baseKeymap),
  buildInputRules(schema),
  history(),
  keymap({
    'Mod-z': undo,
    'Shift-Mod-z': redo
  }),
  dropCursor(),
  gapCursor(),
  toolbarPlugin(),
  blockTool(),
  vueNodeViews({
    image: ImageNodeView
  })
]
