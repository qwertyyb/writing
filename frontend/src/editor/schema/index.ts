import {Schema, type NodeSpec, type MarkSpec, } from "prosemirror-model"
import { createImageNode } from "../nodes/ImageNode"
import { listNodes } from "./list"

/// [Specs](#model.NodeSpec) for the nodes defined in this schema.
export const nodes: Record<string, NodeSpec> = {
  /// NodeSpec The top level document node.
  doc: {
    content: "block+"
  },

  /// A plain paragraph textblock. Represented in the DOM
  /// as a `<p>` element.
  paragraph: {
    content: "inline*",
    group: "block",
    parseDOM: [{tag: "p"}],
    toDOM() { return ['p', 0] }
  },

  /// A blockquote (`<blockquote>`) wrapping one or more blocks.
  blockquote: {
    content: "block+",
    group: "block",
    defining: true,
    parseDOM: [{tag: "blockquote"}],
    toDOM() { return ['blockquote', 0] }
  },

  /// A horizontal rule (`<hr>`).
  divider: {
    group: "block",
    parseDOM: [{tag: "hr"}],
    toDOM() { return ['hr'] }
  },

  /// A heading textblock, with a `level` attribute that
  /// should hold the number 1 to 6. Parsed and serialized as `<h1>` to
  /// `<h6>` elements.
  heading: {
    attrs: {level: {default: 2}},
    content: "inline*",
    group: "block",
    defining: true,
    parseDOM: [{tag: "h1", attrs: {level: 1}},
               {tag: "h2", attrs: {level: 2}},
               {tag: "h3", attrs: {level: 3}},
               {tag: "h4", attrs: {level: 4}},
               {tag: "h5", attrs: {level: 5}},
               {tag: "h6", attrs: {level: 6}}],
    toDOM(node) { return ["h" + node.attrs.level, 0] }
  },

  /// A code listing. Disallows marks or non-text inline
  /// nodes by default. Represented as a `<pre>` element with a
  /// `<code>` element inside of it.
  code: {
    content: "text*",
    marks: "",
    group: "block",
    code: true,
    defining: true,
    parseDOM: [{tag: "pre", preserveWhitespace: "full"}],
    toDOM() { return ["pre", ["code", 0]] }
  },

  /// The text node.
  text: {
    group: "inline"
  },

  /// An inline image (`<img>`) node. Supports `src`,
  /// `alt`, and `href` attributes. The latter two default to the empty
  /// string.
  image: {
    attrs: {
      src: {},
      alt: {default: null},
      title: {default: null},
      size: { default: 50 },
      align: { default: 'Center' },
    },
    group: "block",
    draggable: true,
    parseDOM: [{tag: "img[src]", getAttrs(dom) {
      if (typeof dom === 'string') return false
      return {
        src: dom.getAttribute("src"),
        title: dom.getAttribute("title"),
        alt: dom.getAttribute("alt")
      }
    }}],
    toDOM: createImageNode
  },

  ...listNodes
}

/// [Specs](#model.MarkSpec) for the marks in the schema.
export const marks: Record<string, MarkSpec> = {
  /// A link. Has `href` and `title` attributes. `title`
  /// defaults to the empty string. Rendered and parsed as an `<a>`
  /// element.
  link: {
    attrs: {
      href: {},
      title: {default: null}
    },
    inclusive: false,
    parseDOM: [{tag: "a[href]", getAttrs(dom) {
      return {href: (dom as HTMLElement).getAttribute("href"), title: (dom as HTMLElement).getAttribute("title")}
    }}],
    toDOM(node) { const {href, title} = node.attrs; return ["a", {href, title}, 0] }
  },

  /// An emphasis mark. Rendered as an `<em>` element. Has parse rules
  /// that also match `<i>` and `font-style: italic`.
  em: {
    parseDOM: [
      {tag: "i"}, {tag: "em"},
      {style: "font-style=italic"},
      {style: "font-style=normal", clearMark: m => m.type.name == "em"}
    ],
    toDOM() { return ["em", 0] }
  },

  /// A strong mark. Rendered as `<strong>`, parse rules also match
  /// `<b>` and `font-weight: bold`.
  strong: {
    parseDOM: [
      {tag: "strong"},
      // This works around a Google Docs misbehavior where
      // pasted content will be inexplicably wrapped in `<b>`
      // tags with a font-weight normal.
      {tag: "b", getAttrs: (node) => (node as HTMLElement).style.fontWeight != "normal" && null},
      {style: "font-weight=400", clearMark: m => m.type.name == "strong"},
      {style: "font-weight", getAttrs: (value) => /^(bold(er)?|[5-9]\d{2,})$/.test(value as string) && null},
    ],
    toDOM() { return ["strong", 0] }
  },

  /// Code font mark. Represented as a `<code>` element.
  icode: {
    parseDOM: [{tag: "code"}],
    toDOM() { return ["code", 0] }
  },

  icon: {
    parseDOM: [{tag: 'img.icon'}],
    toDOM(node) { const {src, alt, title} = node.attrs; return ["img", {class: 'icon', src, alt, title}] }
  },

  del: {
    parseDOM: [
      { tag: 'del' },
      { style: 'text-decoration: line-through' },
    ],
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