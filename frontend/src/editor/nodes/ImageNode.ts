import { logger } from "@/utils/logger";
import crelt from "crelt";
import type { Attrs, Node } from "prosemirror-model";

class Resizer {
  dom: HTMLElement

  constructor(private options: {
    direction: 'Left' | 'Right',
    container: HTMLElement,
    node: Node,
    change: (value: number) => void
  }) {
    this.dom = crelt('div', {
      class: ['image-resizer', options.direction].join(' '),
      onpointerdown: this.pointerdown.bind(this),
      onpointermove: this.pointermove.bind(this),
      onpointerup: this.pointerup.bind(this)
    })
  }

  pointerdown(event: PointerEvent) {
    event.preventDefault();
    (event.target as HTMLElement).setPointerCapture(event.pointerId)
  }

  pointermove(event: PointerEvent) {
    if (event.buttons !== 1 || event.target !== this.dom) return
    event.preventDefault()
    const rect = this.options.container.getBoundingClientRect()
    const { node, direction } = this.options
    const { align } = node.attrs
    if (align === 'Center' || !align) {
      const imageWidth = direction === 'Left'
        ? (rect.width / 2 + rect.left - event.clientX) * 2
        : (event.clientX - (rect.width / 2 + rect.left)) * 2
      const value = imageWidth / rect.width * 100
      this.change(value)
    } else if (align === 'Left' && direction === 'Right') {
      const imageWidth = event.clientX - rect.left
      const value = imageWidth / rect.width * 100
      this.change(value)
    } else if (align === 'Right' && direction === 'Left') {
      const imageWidth = rect.right - event.clientX
      const value = imageWidth / rect.width * 100
      this.change(value)
    }
  }

  pointerup(event: PointerEvent) {
    event.preventDefault();
    (event.target as HTMLElement).setPointerCapture(event.pointerId)
  }

  change(value: number) {
    this.options.change?.(value)
  }
}

class ImageNode {
  dom: HTMLElement
  leftResizer: Resizer
  rightResizer: Resizer

  constructor(private node: Node) {
    const image = crelt('img', {
      alt: node.attrs.title,
      class: 'image',
      src: node.attrs.src || 'https://via.placeholder.com/200',
      title: node.attrs.title
    })
    const wrapper = crelt('div', {
      class: 'image-node-wrapper'
    }, image)
    const dom = crelt('div', {
      class: 'image-node',
    }, wrapper)
    this.leftResizer = new Resizer({
      direction: 'Left',
      container: dom,
      node,
      change: (size) => this.update({ size })
    })
    this.rightResizer = new Resizer({
      direction: 'Right',
      container: dom,
      node,
      change: (size) => this.update({ size })
    })
    wrapper.appendChild(this.leftResizer.dom)
    wrapper.appendChild(this.rightResizer.dom)
    this.dom = dom
  }

  update(attrs: Attrs) {
    logger.i('attrs', attrs)
  }
}

export const createImageNode = (node: Node) => {
  const image = crelt('img', {
    alt: node.attrs.title,
    class: 'image',
    src: node.attrs.src || 'https://via.placeholder.com/200',
    title: node.attrs.title,
    style: `width:${node.attrs.size}%`
  })
  const dom = crelt('div', {
    class: ['image-node', `align-${node.attrs.align}`].join(' '),
  }, image)
  return dom
}