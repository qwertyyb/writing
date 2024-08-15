import { type NodeSpec } from "prosemirror-model";

export const katexSchema = (options: { group: string }): NodeSpec => ({
  attrs: {
    source: {
      default: ''
    }
  },
  group: options.group,
  marks: ''
})