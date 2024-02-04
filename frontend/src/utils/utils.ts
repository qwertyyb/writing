
type CallFn = (...args: any[]) => any

export const debounce = <F extends CallFn>(fn: F, ms = 300) => {
  let timeout: ReturnType<typeof setTimeout> | null = null
  return (...args: Parameters<typeof fn>) => {
    if (timeout) {
      clearTimeout(timeout)
    }
    timeout = setTimeout(() => {
      fn(...args)
    }, ms)
  }
}