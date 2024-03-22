
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

export const randomString = (e = 8) => {    
  e = e || 32;
  const t = "ABCDEFGHJKMNPQRSTWXYZabcdefhijkmnprstwxyz";
  const a = t.length;
  let n = "";
  for (let i = 0; i < e; i++) {
    n += t.charAt(Math.floor(Math.random() * a));
  }
  return n
}