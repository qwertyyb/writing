import Dexie from 'dexie'
import type { IFileServer } from './base'

const createFileSystemHandleStorage = () => {
  const db = new Dexie('filesystemHandle')
  db.version(1).stores({
    handle: '&name'
  })
  return {
    get: (key: string): Promise<FileSystemDirectoryHandle | undefined | null> => {
      // eslint-disable-next-line no-async-promise-executor
      return new Promise(async (resolve) => {
        // @ts-ignore
        const row = await db.handle.get(key)
        if (!row) return resolve(undefined)
        const handle: FileSystemDirectoryHandle = row.handle
        if ('queryPermission' in handle) {
          // @ts-ignore
          const permission: PermissionState = await handle.queryPermission({ mode: 'readwrite' })
          if (permission !== 'granted') return resolve(null)
          resolve(handle)
        }
        return resolve(null)
      })
    },
    set: async (key: string, val: FileSystemDirectoryHandle) => {
      // @ts-ignore
      await db.handle.put({ name: key, handle: val }, key)
    }
  }
}

const fsHandleStorage = createFileSystemHandleStorage()

export class FileSystemServer implements IFileServer {
  root: FileSystemDirectoryHandle | null = null
  resolve!: (value: FileSystemDirectoryHandle | PromiseLike<FileSystemDirectoryHandle>) => void
  reject!: (reason: any) => void
  ready: Promise<unknown>
  constructor(private config: { name: string }) {
    this.ready = new Promise<FileSystemDirectoryHandle>((resolve, reject) => {
      this.resolve = resolve
      this.reject = reject
    })
    this.getAuthorizedDirectoryHandle().then(handle => {
      if (!handle) return
      this.root = handle
      this.resolve(handle)
    })
  }

  getAuthorizedDirectoryHandle = async () => {
    const handle = await fsHandleStorage.get(this.config.name)
    if (!handle) return null
    if ('queryPermission' in handle && typeof handle.queryPermission === 'function') {
      const permission: PermissionState = await handle.queryPermission({ mode: 'readwrite' })
      if (permission !== 'granted') return
      return handle
    }
    return null
  }

  private createDirectory = async (path: string[]) => {
    return path.reduce((acc, name) => {
      return acc.then((prev) => prev.getDirectoryHandle(name, { create: true }))
    }, Promise.resolve(this.root!))
  }

  authDirectory = async () => {
    // @ts-ignore
    this.root = await window.showDirectoryPicker({ mode: 'readwrite', id: this.config.name })
    if (this.root) {
      await fsHandleStorage.set(this.config.name, this.root)
      this.resolve(this.root)
    }
  }

  directoryAuthorized = async () => {
    const handle = await this.getAuthorizedDirectoryHandle()
    return !!handle
  }

  removeFile = async (name: string) => {
    await this.ready
    await this.root?.removeEntry(name)
  }

  writeFile = async (content: Blob | File, name: string) => {
    await this.ready
    const path = name.split('/')
    const fileName = path[path.length - 1]
    const dirHandle = await this.createDirectory(path.slice(0, path.length - 1))
    const fileHandle = await dirHandle.getFileHandle(fileName, { create: true })
    const writeStream = await fileHandle!.createWritable()
    writeStream.write(await content.arrayBuffer())
    await writeStream.close()
  }

  readFile = async (name: string) => {
    await this.ready
    const path = name.split('/')
    const fileName = path[path.length - 1]
    const dirHandle = await this.createDirectory(path.slice(0, path.length - 1))
    const fileHandle = await dirHandle.getFileHandle(fileName)
    const file = await fileHandle.getFile()
    return file
  }

  readJSON = async (name: string) => {
    await this.ready
    const file = await this.readFile(name)
    try {
      return JSON.parse(await file.text())
    } catch (err) {
      return null
    }
  }

  writeJSON = async (json: any, name: string) => {
    await this.ready
    const content = new Blob([JSON.stringify(json)], { type: 'application/json' })
    await this.writeFile(content, name)
  }
}
