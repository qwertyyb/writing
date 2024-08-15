import {
  inputRules,
  wrappingInputRule,
  textblockTypeInputRule,
  smartQuotes,
  emDash,
  ellipsis,
  InputRule
} from 'prosemirror-inputrules'
import { MarkType, NodeType, Schema } from 'prosemirror-model'
import { TextSelection } from 'prosemirror-state'
import { languages } from '@codemirror/language-data'
import { LanguageDescription } from '@codemirror/language'
import { katexBlockRule, katexRule } from '../nodes/katex'

/// Given a blockquote node type, returns an input rule that turns `"> "`
/// at the start of a textblock into a blockquote.
export function blockQuoteRule(nodeType: NodeType) {
  return wrappingInputRule(/^\s*>\s$/, nodeType)
}

function horizontalRule(nodeType: NodeType) {
  return new InputRule(/^((___)|(\*\*\*))$/, (state, match, start, end) => {
    return state.tr.replaceRangeWith(start, end, nodeType.createAndFill()!)
  })
}

/// Given a list node type, returns an input rule that turns a number
/// followed by a dot at the start of a textblock into an ordered list.
export function orderedListRule(nodeType: NodeType) {
  return wrappingInputRule(
    /^(\d+)\.\s$/,
    nodeType,
    (match) => ({ order: +match[1] }),
    (match, node) => node.childCount + node.attrs.order == +match[1]
  )
}

/// Given a list node type, returns an input rule that turns a bullet
/// (dash, plush, or asterisk) at the start of a textblock into a
/// bullet list.
export function bulletListRule(nodeType: NodeType) {
  return wrappingInputRule(/^\s*([-+*])\s$/, nodeType)
}

/// Given a code block node type, returns an input rule that turns a
/// textblock starting with three backticks into a code block.
export function codeBlockRule(nodeType: NodeType) {
  return textblockTypeInputRule(
    /^```(\S*)\s$/,
    nodeType,
    match => ({ language: LanguageDescription.matchLanguageName(languages, match[1])?.name || match[1] })
  )
}

/// Given a node type and a maximum level, creates an input rule that
/// turns up to that number of `#` characters followed by a space at
/// the start of a textblock into a heading whose level corresponds to
/// the number of `#` signs.
export function headingRule(nodeType: NodeType, maxLevel: number) {
  return textblockTypeInputRule(new RegExp('^(#{1,' + maxLevel + '})\\s$'), nodeType, (match) => ({
    level: match[1].length
  }))
}

const imageNodeTypeInputRule = (nodeType: NodeType) => {
  const regexp = /^!\[(?<title>[^[\]]*)\]\((?<href>[^()]+)\)$/
  return new InputRule(regexp, (state, match, start, end) => {
    const { title, href } = match.groups ?? {}
    if (!title && !href) return null
    const tr = state.tr
    const image = nodeType.createAndFill({
      title,
      src: href,
    })!
    const $from = tr.doc.resolve(start)
    const pos = $from.before()
    return tr.delete($from.before(), $from.after())
      .insert(pos, image)
      .setSelection(TextSelection.create(tr.doc, pos + 2))
      .insertText(title || '')
      .scrollIntoView()
  })
}

export function todoRule(nodeType: NodeType) {
  return wrappingInputRule(
    /^\[(\s|x)\]$/,
    nodeType,
    (match) => ({ checked: match[1] === 'x' }),
  )
}

const boldMarkTypeInputRule = (markType: MarkType) => {
  const regexp = /\*\*([^*]+)\*\*$/
  return new InputRule(regexp, (state, match, start, end) => {
    const tr = state.tr
    console.log(state.doc.textContent)
    return tr.addMark(start, end, markType.create())
      .delete(start, start + 2)
      .delete(tr.mapping.map(end - 1), tr.mapping.map(end))
  })
}

const italicMarkTypeInputRule = (markType: MarkType) => {
  const regexp = /(?<!\*)\*([^*]+)\*$/
  return new InputRule(regexp, (state, match, start, end) => {
    const tr = state.tr
    return tr.addMark(start, end, markType.create())
      .delete(start, start + 1)
  })
}

const delMarkTypeInputRule = (markType: MarkType) => {
  const regexp = /~~([^~]+)~~$/
  return new InputRule(regexp, (state, match, start, end) => {
    const tr = state.tr
    return tr.addMark(start, end, markType.create())
      .delete(start, start + 2)
      .delete(tr.mapping.map(end - 1), tr.mapping.map(end))
  })
}

const codeMarkTypeInputRule = (markType: MarkType) => {
  const regexp = /`([^`]+)`$/
  return new InputRule(regexp, (state, match, start, end) => {
    const tr = state.tr
    return tr.addMark(start, end, markType.create())
      .delete(start, start + 1)
  })
}

const linkMarkTypeInputRule = (markType: MarkType) => {
  const regexp = /(?<!!)\[(?<title>[^[\]]*)\]\((?<href>[^()]+)\)$/
  return new InputRule(regexp, (state, match, start, end) => {
    const { title, href } = match.groups ?? {}
    if (!title && !href) return null
    const tr = state.tr
    const text = title || href
    return tr.insertText(text, start, end)
      .addMark(start, start + text.length, markType.create({ href }))
  })
}

/// A set of input rules for creating the basic block quotes, lists,
/// code blocks, and heading.
export function buildInputRules(schema: Schema) {
  const rules = [...smartQuotes, ellipsis, emDash]
  let type: NodeType
  if ((type = schema.nodes.blockquote)) rules.push(blockQuoteRule(type))
  if ((type = schema.nodes.ordered_list)) rules.push(orderedListRule(type))
  if ((type = schema.nodes.bullet_list)) rules.push(bulletListRule(type))
  if ((type = schema.nodes.code_block)) rules.push(codeBlockRule(type))
  if ((type = schema.nodes.heading)) rules.push(headingRule(type, 6))
  if ((type = schema.nodes.horizontal_rule)) rules.push(horizontalRule(type))
  if ((type = schema.nodes.image)) rules.push(imageNodeTypeInputRule(type))
  if ((type = schema.nodes.todo)) rules.push(todoRule(type))
  if ((type = schema.nodes.katex_block)) rules.push(katexBlockRule(type))
  if ((type = schema.nodes.katex)) rules.push(katexRule(type))

  if (schema.marks.strong) rules.push(boldMarkTypeInputRule(schema.marks.strong))
  if (schema.marks.em) rules.push(italicMarkTypeInputRule(schema.marks.em))
  if (schema.marks.code) rules.push(codeMarkTypeInputRule(schema.marks.code))
  if (schema.marks.del) rules.push(delMarkTypeInputRule(schema.marks.del))
  if (schema.marks.link) rules.push(linkMarkTypeInputRule(schema.marks.link))

  return inputRules({ rules })
}
