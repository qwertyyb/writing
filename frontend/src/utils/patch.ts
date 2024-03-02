import jsonpatch from 'jsonpatch'

interface JSONPatch {
  op: 'add' | 'remove' | 'replace' | 'move' | 'copy' | 'test',
  path: (string | number)[],
  value?: any,
  from?: (string | number)[]
}

export interface AddJSONPatch extends JSONPatch {
  op: 'add',
  value: any
}

export interface RemoveJSONPatch extends JSONPatch {
  op: 'remove'
}

export interface ReplaceJSONPatch extends JSONPatch {
  op: 'replace'
  value: any
}

export interface MoveJSONPatch extends JSONPatch {
  op: 'move'
  from: (string | number)[]
}

export interface CopyJSONPatch extends JSONPatch {
  op: 'copy'
  from: (string | number)[]
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
}

export const applyPatch = (doc: any, patches: JSONPatch[]) => {
  return jsonpatch.apply_patch(doc, patches.map(item => ({ ...item, path: '/' + item.path.join('/') })));
}