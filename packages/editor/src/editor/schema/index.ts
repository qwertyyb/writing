import { Schema, type NodeSpec, type MarkSpec } from 'prosemirror-model'
import { bulletList, listItem, orderedList } from 'prosemirror-schema-list'
import { todo } from '../nodes/todo'
import { detailsSchema } from '../nodes/details'
import { callout } from '../nodes/callout'
import { imageSchema } from '../nodes/image'
import { codeBlockSchema } from '../nodes/code'
import { katexSchema } from '../nodes/katex'

/// [Specs](#model.NodeSpec) for the nodes defined in this schema.
export const nodes: Record<string, NodeSpec> = {
  /// NodeSpec The top level document node.
  doc: {
    content: 'block+'
  },

  /// A plain paragraph textblock. Represented in the DOM
  /// as a `<p>` element.
  paragraph: {
    attrs: {
      align: {
        default: 'left'
      }
    },
    content: 'inline*',
    group: 'block',
    parseDOM: [{ tag: 'p' }],
    toDOM() {
      return ['p', 0]
    }
  },

  /// The text node.
  text: {
    inline: true,
    group: 'inline',
    marks: '_'
  },

  /// A heading textblock, with a `level` attribute that
  /// should hold the number 1 to 6. Parsed and serialized as `<h1>` to
  /// `<h6>` elements.
  heading: {
    attrs: {
      level: { default: 2 },
      align: {
        default: 'left'
      }
    },
    content: 'inline*',
    marks: '',
    group: 'block',
    defining: true,
    parseDOM: [
      { tag: 'h1', attrs: { level: 1 } },
      { tag: 'h2', attrs: { level: 2 } },
      { tag: 'h3', attrs: { level: 3 } },
      { tag: 'h4', attrs: { level: 4 } },
      { tag: 'h5', attrs: { level: 5 } },
      { tag: 'h6', attrs: { level: 6 } }
    ],
    toDOM(node) {
      return ['h' + node.attrs.level, 0]
    }
  },

  /// A blockquote (`<blockquote>`) wrapping one or more blocks.
  blockquote: {
    content: 'block+',
    group: 'block',
    defining: true,
    parseDOM: [{ tag: 'blockquote' }],
    toDOM() {
      return ['blockquote', 0]
    }
  },

  /// A horizontal rule (`<hr>`).
  horizontal_rule: {
    group: 'block',
    parseDOM: [{ tag: 'hr' }],
    toDOM() {
      return ['hr']
    }
  },

  /// A code listing. Disallows marks or non-text inline
  /// nodes by default. Represented as a `<pre>` element with a
  /// `<code>` element inside of it.
  code_block: codeBlockSchema({ content: 'inline*', group: 'block' }),

  /// A blockquote (`<blockquote>`) wrapping one or more blocks.
  plain_text: {
    content: 'inline*',
    group: 'plain',
    marks: '',
    parseDOM: [{ tag: 'p' }],
    toDOM() {
      return ['p', 0]
    }
  },

  image: imageSchema({ content: 'plain_text', group: 'block' }),

  ...detailsSchema({ summaryContent: 'inline*', detailsContent: 'block*', detailsGroup: 'block' }),

  callout: callout({ content: 'block+', group: 'block' }),

  katex: katexSchema({ group: 'block' }),

  bullet_list: {
    ...bulletList,
    draggable: false,
    group: 'block',
    content: 'group_list_item+'
  },
  ordered_list: {
    ...orderedList,
    draggable: false,
    group: 'block',
    content: 'group_list_item+'
  },
  list_item: {
    ...listItem,
    group: 'group_list_item',
    content: '(block|todo_block)+',
    draggable: false,
  },

  todo: todo({ group: 'todo_block', content: 'block+' })
}

/// [Specs](#model.MarkSpec) for the marks in the schema.
export const marks: Record<string, MarkSpec> = {
  /// A link. Has `href` and `title` attributes. `title`
  /// defaults to the empty string. Rendered and parsed as an `<a>`
  /// element.
  link: {
    attrs: {
      href: {}
    },
    inclusive: false,
    parseDOM: [
      {
        tag: 'a[href]',
        getAttrs(dom) {
          return {
            href: (dom as HTMLElement).getAttribute('href')
          }
        }
      }
    ],
    toDOM(node) {
      const { href, title } = node.attrs
      return ['a', { href, title }, 0]
    }
  },

  /// An emphasis mark. Rendered as an `<em>` element. Has parse rules
  /// that also match `<i>` and `font-style: italic`.
  em: {
    inclusive: false,
    parseDOM: [
      { tag: 'i' },
      { tag: 'em' },
      { style: 'font-style=italic' },
      { style: 'font-style=normal', clearMark: (m) => m.type.name == 'em' }
    ],
    toDOM() {
      return ['em', 0]
    }
  },

  /// A strong mark. Rendered as `<strong>`, parse rules also match
  /// `<b>` and `font-weight: bold`.
  strong: {
    inclusive: false,
    parseDOM: [
      { tag: 'strong' },
      // This works around a Google Docs misbehavior where
      // pasted content will be inexplicably wrapped in `<b>`
      // tags with a font-weight normal.
      { tag: 'b', getAttrs: (node) => (node as HTMLElement).style.fontWeight != 'normal' && null },
      { style: 'font-weight=400', clearMark: (m) => m.type.name == 'strong' },
      {
        style: 'font-weight',
        getAttrs: (value) => /^(bold(er)?|[5-9]\d{2,})$/.test(value as string) && null
      }
    ],
    toDOM() {
      return ['strong', 0]
    }
  },

  /// Code font mark. Represented as a `<code>` element.
  code: {
    inclusive: false,
    parseDOM: [{ tag: 'code' }],
    toDOM() {
      return ['code', 0]
    }
  },

  del: {
    inclusive: false,
    excludes: 'underline',
    parseDOM: [{ tag: 'del' }, { style: 'text-decoration: line-through' }],
    toDOM() {
      return ['del', 0]
    }
  },

  underline: {
    inclusive: false,
    excludes: 'del',
    parseDOM: [{ tag: 'u' }, { style: 'text-decoration: underline' }],
    toDOM(mark, inline) {
      if (inline) {
        return ['span', { style: 'text-decoration: underline' }, 0]
      }
      return ['div', { style: 'text-decoration: underline' }, 0]
    }
  },

  super: {
    inclusive: false,
    excludes: 'sub',
    parseDOM: [{ tag: 'sup' }, { style: 'vertical-align: super' }],
    toDOM() {
      return ['sup', 0]
    }
  },

  sub: {
    inclusive: false,
    excludes: 'super',
    parseDOM: [{ tag: 'sub' }, { style: 'vertical-align: sub' }],
    toDOM() {
      return ['sub', 0]
    }
  },

  color: {
    attrs: {
      color: {}
    },
    parseDOM: [
      {
        style: 'color',
        getAttrs(dom) {
          const color = (dom as any)?.style?.color
          return color ?? false
        }
      }
    ],
    toDOM(mark) {
      return ['span', { style: `color: ${mark.attrs.color}` }, 0]
    }
  },

  backgroundColor: {
    attrs: {
      backgroundColor: {}
    },
    parseDOM: [
      {
        style: 'background-color',
        getAttrs(dom) {
          const color = (dom as any)?.style?.backgroundColor
          return color ? { color } : false
        }
      }
    ],
    toDOM(mark) {
      return ['span', { style: `background-color: ${mark.attrs.backgroundColor}` }, 0]
    }
  }
}

/// This schema roughly corresponds to the document schema used by
/// [CommonMark](http://commonmark.org/), minus the list elements,
/// which are defined in the [`prosemirror-schema-list`](#schema-list)
/// module.
///
/// To reuse elements from this schema, extend or read from its
/// `spec.nodes` and `spec.marks` [properties](#model.Schema.spec).
export const schema = new Schema({ nodes, marks })
