import { createLogger } from '@writing/utils/logger';
import Quill from 'quill';
import Delta from 'quill-delta';
import * as R from 'ramda';
import { toText } from '@writing/utils/delta';

const logger = createLogger('markdown');

export class Markdown {
  rules = [
    { name: 'code', rule: /`([^`]+)`$/, source: '`$1`' },
    { name: 'bold', rule: /\*\*([^*]+)\*\*$/, source: '**$1**'},
    { name: 'italic', rule: /(?<!\*)\*([^*]+)\*$/, source: '*$1*' },
    { name: 'strike', rule: /~~([^~]+)~~$/, source: '~~$1~~' },
    { name: 'link', rule: /\[([^[\]]+)\]\((?<attr>[^()]+)\)$/, source: '[$1]($<attr)' },
    { name: 'link', rule: /<(?<attr>[^<>]+)>$/, source: '<$1>' },

    {
      name: 'formula',
      rule: /\$([^$]+)\$$/,
      source: '$$1$',
      transform: (origin: Delta, pos: number, match: RegExpMatchArray, editor: Quill) => {
        logger.i(origin, pos, match);
        const newVal = origin.compose(
          new Delta().retain(match.index)
            .delete(match[0].length)
            .insert({ formula: match[1] })
            .insert(' ')
        );
        editor.setContents(newVal);
        setTimeout(() => {
          this.quill.setSelection(pos - match[0].length + 1 + 1, 0);
        });
        return; 
      },
      toSource: (op: any, pos: number, origin: Delta, editor: Quill) => {
        if (typeof op.insert === 'object' && typeof op.insert?.formula === 'string') {
          const formula = op.insert.formula as string;
          const newVal = origin.compose(
            new Delta().retain(pos - 1)
              .delete(2)
              .insert(`$${formula}$`)
          );
          editor.setContents(newVal);
          
          setTimeout(() => {
            this.quill.setSelection(pos - 1 + formula.length + 2, 0);
          });
          return true;
        }
        return false;
      }
    }
  ];

  constructor(private quill: Quill, private options = {}) {
    logger.i('markdown module init');
    this.quill.on('text-change', this.changeHandler);
  }

  insertHandler = (pos: number, origin: Delta) => {
    const before = origin.slice(0, pos);
    const text = toText(before.ops);
    const target = this.rules
      .find((item) => item.rule.test(text));

    if (!target) return;
    const { name, rule, transform } = target;
    const match = text.match(rule)!;
    if (typeof transform === 'function') {
      return transform(origin, pos, match, this.quill);
    }
    const attr: string | boolean = match.groups?.attr ?? true;
    if (!attr) return;
    const changes = new Delta([
      ...(match.index ? [{ retain: match.index }] : []),
    ])
      .delete(match[0].length)
      .insert(match[1], { [name]: attr })
      .insert(' ');
    const result = origin.compose(changes);

    logger.w('result', result);
    this.quill.setContents(result as any);
    setTimeout(() => {
      this.quill.setSelection(before.length() - match[0].length + match[1].length + 1, 0);
    });
  };

  deleteHandler = (index: number, origin: Delta) => {
    const before = origin.slice(0, index);
    const after = origin.slice(index);

    const op = R.last(before.ops);
    if (!op) return;

    for (let i = 0; i < this.rules.length; i += 1) {
      const rule = this.rules[i];
      if (typeof rule.toSource === 'function') {
        return rule.toSource(op, index, origin, this.quill);
      }
    }

    if (!op.attributes) return;

    const target = this.rules.find(item => op.attributes[item.name]);
    if (!target) return;
    const { name, source } = target;
    const attr = op.attributes[name];
    if (!attr) return;

    const isInBetween = op?.attributes?.[name] && R.head(after.ops)?.attributes?.[name];
    if (isInBetween) return;

    let newValue = source.replace('$1', op.insert as string);
    if (typeof attr === 'string') {
      if (attr === op.insert && name === 'link') {
        newValue = `<${op.insert}>`;
      } else {
        newValue = source.replace('$1', op.insert as string).replace('$<attr', attr);
      }
    }
    if (!newValue) return;

    const originLen = op.insert!.length as number;
    const result = origin.compose(new Delta([
      ... ((index - originLen) ? [{ retain: index - originLen }] : []),
      { delete: originLen + 1 },
      { insert: newValue, attributes: { ...op.attributes, [name]: null } },
    ]));
    logger.w('expect', result);
    this.quill.setContents(result as any);
    setTimeout(() => {
      this.quill.setSelection(index - originLen + newValue.length, 0);
    });
  };

  changeHandler = (delta: Delta, origin: Delta, source: 'api' | 'user' | 'silent') => {
    if (source !== 'user') return;
    if (delta.ops.length > 2) return;

    let first = delta.ops[0];
    const last = R.last(delta.ops);
    if (delta.ops.length === 1) {
      first = { retain: 0 };
    }
    if (!first.retain || !last || (!last?.insert && !last.delete)) return;
    if (last.delete) {
      this.deleteHandler(first.retain as number, origin);
    } else if (last.insert) {
      logger.i('start', origin.compose(delta));
      const pos = first.retain as number + ((last.insert?.length as number) ?? 0);
      this.insertHandler(pos, origin.compose(delta));
    }
  };
}