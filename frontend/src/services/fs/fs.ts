import Dexie from 'dexie'
import { type Adapter } from 'lowdb'
import type { IDocument, IConfig, IAttribute, IFile,  } from "../types"

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

export class FileSystemServer {
  root: FileSystemDirectoryHandle | null = null
  resolve!: (value: unknown) => void
  reject!: (reason: any) => void
  ready: Promise<unknown>
  constructor(private config: { name: string }) {
    this.ready = new Promise((resolve, reject) => {
      this.resolve = resolve
      this.reject = reject
      return fsHandleStorage.get(this.config.name)
    }).then(handle => {
      if (handle) return this.resolve(handle)
    })
  }

  private createDirectory = async (path: string[]) => {
    return path.reduce((acc, name) => {
      return acc.then((prev) => prev.getDirectoryHandle(name, { create: true }))
    }, Promise.resolve(this.root!))
  }

  requestRoot = async () => {
    // @ts-ignore
    this.root = await window.showDirectoryPicker({ mode: 'readwrite', id: this.config.name })
    if (this.root) {
      await fsHandleStorage.set(this.config.name, this.root)
    }
    this.resolve(this.root)
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
    return true
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
    return true
  }
}

export class FileSystemLowAdapter<T> implements Adapter<T> {
  constructor(private fsServer: FileSystemServer, private fileName: string) {}
  read = () => {
    return this.fsServer.readJSON(this.fileName)
  }
  write = async (data: T) => {
    await this.fsServer.writeJSON(data, this.fileName)
    return
  }
}

export interface Database {
  document: (IDocument & { attributes: IAttribute[] })[]
  config: IConfig[]
  file: IFile[]
}

export const defaultData = (): Database => ({
  document: [],
  config: [],
  file: []
})
