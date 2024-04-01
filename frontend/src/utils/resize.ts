import * as R from 'ramda'

export enum ScreenSize {
  Small = 'Small',
  Large = 'Large'
}

const smallInlineMaxSize = 540

let curScreenSize: ScreenSize = ScreenSize.Large

let handlers: ((size: ScreenSize) => void)[] = []

let observer: ResizeObserver | null = null

const initObserver = () => {
  if (observer) return;
  observer = new ResizeObserver((entries) => {
    const last = R.last(entries)!
    const oldValue = curScreenSize
    curScreenSize = last.contentRect.width <= smallInlineMaxSize ? ScreenSize.Small : ScreenSize.Large
    if (oldValue !== curScreenSize) {
      handlers.forEach(handler => handler(curScreenSize))
    }
  })
  observer.observe(document.documentElement)
}

export const sizeChange = (callback: (size: ScreenSize) => void) => {
  handlers.push(callback)
  if (observer) {
    callback(curScreenSize)
  } else {
    initObserver()
  }
  return () => {
    handlers = handlers.filter(handler => handler !== callback)
    if (!handlers.length) {
      observer?.disconnect()
      observer = null
    }
  }
}