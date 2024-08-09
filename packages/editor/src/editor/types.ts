export interface NodeValue {
  type: string
  attrs?: Record<string, any>
  marks?: { type: string, attrs?: Record<string, any> }[]
  text?: string,
  content?: NodeValue[]
}