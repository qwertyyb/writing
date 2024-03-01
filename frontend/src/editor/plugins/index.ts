import { toolbar } from "./toolbar/toolbar";
import { history, redo, undo } from 'prosemirror-history'
import { keymap } from 'prosemirror-keymap'
import { baseKeymap } from 'prosemirror-commands'
import { dropCursor } from 'prosemirror-dropcursor'
import { gapCursor } from 'prosemirror-gapcursor'
import type { Schema } from "prosemirror-model";
import { buildKeymap } from "./keymap";
import { blockTool } from "./block/block-tool";

export const createPlugins = (schema: Schema) => [
  keymap(baseKeymap),
  history(),
  keymap({
    "Mod-z": undo,
    "Shift-Mod-z": redo
  }),
  keymap(buildKeymap(schema)),
  dropCursor(),
  gapCursor(),
  toolbar(),
  blockTool()
]