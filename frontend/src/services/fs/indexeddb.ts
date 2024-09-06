import localforage from 'localforage'
import { type IFileServer } from './base'

const store = localforage.createInstance({
  name: 'writingStore'
})

export class IndexedDBServer implements IFileServer {
  removeFile (path: string) {
    return store.removeItem(path)
  }
  writeJSON (json: any, path: string) {
    return store.setItem(path, json)
  }
  readJSON (path: string) {
    return store.getItem(path)
  }
  readFile (path: string) {
    return store.getItem(path) as Promise<Blob>
  }
  writeFile (content: Blob | File, path: string) {
    return store.setItem(path, content)
  }
}