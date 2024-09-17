import { markdownSerializer } from "../editor/markdown"
import { schema } from "../editor/schema"
import { DOMSerializer, Node } from "prosemirror-model"

export const exportTo = (doc: Node | string | any, type: 'markdown' | 'html') => {
  if (typeof doc === 'string') {
    doc = schema.nodeFromJSON(JSON.parse(doc))
  }
  if (!(doc instanceof Node)) {
    doc = schema.nodeFromJSON(doc)
  }

  if (type === 'markdown') {
    return markdownSerializer.serialize(doc)
  }
  return DOMSerializer.fromSchema(schema).serializeNode(doc)
}