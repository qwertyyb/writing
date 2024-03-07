export interface JSONPatch {
  op: 'add' | 'remove' | 'replace' | 'move' | 'copy' | 'test',
  path: (string | number)[],
  value?: any,
  from?: (string | number)[]
}

export class PatchGenerator {
  patches: JSONPatch[] = []
  add(path: (string | number)[], value: any) {
    this.patches.push({ op: 'add', path, value})
    return this
  }
  remove(path: (string | number)[]) {
    this.patches.push({ op: 'remove', path})
    return this
  }
  replace(path: (string | number)[], value: any) {
    this.patches.push({ op: 'replace', path, value })
    return this
  }
  move(from: (string | number)[], path: (string | number)[]) {
    this.patches.push({ op: 'move', from, path })
    return this
  }
  copy(from: (string | number)[], path: (string | number)[]) {
    this.patches.push({ op: 'copy', from, path })
    return this
  }
  clear() {
    this.patches = []
  }
}