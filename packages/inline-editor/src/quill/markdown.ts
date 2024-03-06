import { createLogger } from '@writing/utils/logger';
import Quill from 'quill';
import Delta from 'quill-delta';
import * as R from 'ramda';
import { toText } from '@writing/utils/delta';

const logger = createLogger('markdown')

export class Markdown {
  rules = {
    code: {
      rule: /`([^`]+)`$/,
      len: 2,
    },
    bold: {
      rule: /\*\*([^*]+)\*\*$/,
      len: 4,
    },
    italic: {
      rule: /(?<!\*)\*([^*]+)\*$/,
      len: 2,
    },
    strike: {
      rule: /~~([^~]+)~~$/,
      len: 4
    }
  }

  constructor(private quill: Quill, private options = {}) {
    logger.i('markdown module init')
    this.quill.on('text-change', this.changeHandler)
  }

  insertHandler = (index: number, insert: string, origin: Delta) => {
    let before = origin.slice(0, index)
      .insert(insert)
    let text = toText(before.ops)
    logger.i(this, this.rules)
    const [key] = Object.entries(this.rules)
      .find(([key, value]) => text.match(value.rule)) ?? []
    if (!key) return
    const match = text.match(this.rules[key].rule)!
    const triggerLength = (match[0].length - match[1].length) / 2
    const changes = new Delta([
      ...(match.index ? [{ retain: match.index }] : []),
      { delete: triggerLength },
      { retain: match[1].length, attributes: { [key]: true } },
      { delete: triggerLength },
      { insert: ' ' }
    ])
    const result = before
      .compose(changes)
      .compose(new Delta([
        { retain: before.length() - triggerLength * 2 + 1 },
        ...origin.slice(index).ops
      ]))
    logger.i('changes', before, changes, before.compose(changes), [
        { retain: before.length() - triggerLength * 2 + 1 },
        ...origin.slice(index).ops
      ], result)
    logger.w('result', result)
    this.quill.setContents(result as any)
    setTimeout(() => {
      this.quill.setSelection(before.length() - triggerLength * 2 + 1, 0)
    })
  }

  deleteHandler = (index: number, origin: Delta) => {
    let before = origin.slice(0, index)
    let after = origin.slice(index)

    const op = R.last(before.ops)
    if (!op || !op.attributes) return

    const isInBetween = op?.attributes?.code && R.head(after.ops)?.attributes?.code
    if (isInBetween) return

    const format = Object.keys(op.attributes).find(name => op.attributes![name])
    if (!format || !op.attributes[format]) return

    const len = op.insert!.length as number
    const result = origin.compose(new Delta([
      { retain: index - len },
      { delete: len + 1 },
      { insert: `\`${op.insert}\``, attributes: { ...op.attributes, [format]: null } },
    ]))
    logger.w('expect', result)
    this.quill.setContents(result as any)
    setTimeout(() => {
      this.quill.setSelection(index + this.rules[format].len, 0)
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