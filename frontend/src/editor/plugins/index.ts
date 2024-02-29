import { tooltipPlugin } from "./tooltip";
import { history } from 'prosemirror-history'
import { keymap } from 'prosemirror-keymap'
import { baseKeymap } from 'prosemirror-commands'
import { dropCursor } from 'prosemirror-dropcursor'
import { gapCursor } from 'prosemirror-gapcursor'
import type { Schema } from "prosemirror-model";
import { buildKeymap } from "./keymap";

export const createPlugins = (schema: Schema) => [
  history(),
  keymap(buildKeymap(schema)),
  keymap(baseKeymap),
  dropCursor(),
  gapCursor(),
  tooltipPlugin
]