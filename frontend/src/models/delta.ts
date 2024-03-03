import type { DeltaOperation } from "quill";
import Delta, { Op } from "quill-delta";

export const concat = (left: DeltaOperation[], right: DeltaOperation[]) => {
  const newOps: DeltaOperation[] = []
  let replaced = false
  for(let i = left.length - 1; i >= 0; i-= 1) {
    const item = { ...left[i] }
    if (typeof item.insert === 'string' && !replaced) {
      item.insert = item.insert.replace(/\n$/, '')
      replaced = true
    }
    newOps.unshift(item)
  }
  const originDelta = new Delta(newOps)
  return {
    ops: originDelta.concat(new Delta(right)).ops,
    originLength: originDelta.length()
  }
}

export const split = (ops: DeltaOperation[], index: number) => {
  const delta = new Delta(ops)
  const before = delta.slice(0, index)
  const after = delta.slice(index)

  return { before: before.ops, after: after.ops }
}

export const toText = (ops: Op[]) => {
  return ops.reduce<string>((acc, cur) => {
    return acc + ((typeof cur.insert === 'string') ? cur.insert : '')
  }, '')
}

export const isEmpty = (ops: Op[]) => {
  const text = toText(ops)
  return text === '' || text === '\n'
}