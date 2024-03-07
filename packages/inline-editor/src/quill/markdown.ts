import { createLogger } from '@writing/utils/logger';
import Quill from 'quill';
import Delta from 'quill-delta';
import * as R from 'ramda';
import { toText } from '@writing/utils/delta';

const logger = createLogger('markdown')

export class Markdown {
  rules = [
    { name: 'code', rule: /`([^`]+)`$/, source: '\`$1\`' },
    { name: 'bold', rule: /\*\*([^*]+)\*\*$/, source: `**$1**`},
    { name: 'italic', rule: /(?<!\*)\*([^*]+)\*$/, source: `*$1*` },
    { name: 'strike', rule: /~~([^~]+)~~$/, source: `~~$1~~` },
    { name: 'link', rule: /\[([^\[\]]+)\]\((?<attr>[^()]+)\)$/, source: `[$1]($<attr)` },
    { name: 'link', rule: /<(?<attr>[^<>]+)>$/, source: `<$1>` }
  ]

  constructor(private quill: Quill, private options = {}) {
    logger.i('markdown module init')
    this.quill.on('text-change', this.changeHandler)
  }

  insertHandler = (index: number, insert: string, origin: Delta) => {
    let before = origin.slice(0, index)
      .insert(insert)
    let text = toText(before.ops)
    const target = this.rules
      .find((item) => item.rule.test(text))

    if (!target) return
    const { name, rule } = target
    const match = text.match(rule)!
    let attr: string | boolean = match.groups?.attr ?? true
    if (!attr) return
    const changes = new Delta([
      ...(match.index ? [{ retain: match.index }] : []),
      { delete: match[0].length },
      { insert: match[1], attributes: { [name]: attr } },
    ]).insert(' ')
    const result = before
      .compose(changes)
      .compose(new Delta([
        { retain: before.length() - match[0].length + match[1].length + 1 },
        ...origin.slice(index).ops
      ]))

    logger.w('result', result)
    this.quill.setContents(result as any)
    setTimeout(() => {
      this.quill.setSelection(before.length() - match[0].length + match[1].length + 1, 0)
    })
  }

  deleteHandler = (index: number, origin: Delta) => {
    let before = origin.slice(0, index)
    let after = origin.slice(index)

    const op = R.last(before.ops)
    if (!op || !op.attributes) return

    const target = this.rules.find(item => op.attributes[item.name])
    if (!target) return
    const { name, rule, source } = target
    const attr = op.attributes[name]
    if (!attr) return

    const isInBetween = op?.attributes?.[name] && R.head(after.ops)?.attributes?.[name]
    if (isInBetween) return

    let newValue = source.replace('$1', op.insert as string)
    if (typeof attr === 'string') {
      if (attr === op.insert && name === 'link') {
        newValue = `<${op.insert}>`
      } else {
        newValue = source.replace('$1', op.insert as string).replace('$<attr', attr)
      }
    }
    if (!newValue) return

    const originLen = op.insert!.length as number
    const result = origin.compose(new Delta([
      ... ((index - originLen) ? [{ retain: index - originLen }] : []),
      { delete: originLen + 1 },
      { insert: newValue, attributes: { ...op.attributes, [name]: null } },
    ]))
    logger.w('expect', result)
    this.quill.setContents(result as any)
    setTimeout(() => {
      this.quill.setSelection(index - originLen + newValue.length, 0)
    })
  }

  changeHandler = (delta: Delta, origin: Delta, source: 'api' | 'user' | 'silent') => {
    if (source !== 'user') return
    if (delta.ops.length > 2) return

    let first = delta.ops[0]
    let last = R.last(delta.ops)
    if (delta.ops.length === 1) {
      first = { retain: 0 }
    }
    if (!first.retain || !last || (!last?.insert && !last.delete)) return
    if (last.delete) {
      this.deleteHandler(first.retain as number, origin)
    } else if (last.insert) {
      this.insertHandler(first.retain as number, last.insert as string, origin)
    }
  }
}