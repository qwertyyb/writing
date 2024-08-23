import Dexie from 'dexie'
import { Low, type Adapter } from 'lowdb'
import type { Document, Config, Attribute, IFile,  } from "../types"


class FileSystemServer {
  root: FileSystemDirectoryHandle | null = null
  resolve!: (value: unknown) => void
  reject!: (reason: any) => void
  ready: Promise<unknown>
  db: Dexie
  constructor() {
    this.db = new Dexie('filesystemHandle')
    this.db.version(1).stores({
      handle: '&name'
    })
    // eslint-disable-next-line no-async-promise-executor
    this.ready = new Promise(async (resolve, reject) => {
      this.resolve = resolve
      this.reject = reject
      // @ts-ignore
      const row = await this.db.handle.get('root')
      if (!row) return
      const handle: FileSystemDirectoryHandle = row.handle
      if ('queryPermission' in handle) {
        // @ts-ignore
        const permission: PermissionState = await handle.queryPermission({ mode: 'readwrite' })
        if (permission !== 'granted') return
        this.root = handle
        this.resolve(handle)
      }
    })
  }

  private createDirectory = async (path: string[]) => {
    return path.reduce((acc, name) => {
      return acc.then((prev) => prev.getDirectoryHandle(name, { create: true }))
    }, Promise.resolve(this.root!))
  }

  requestRoot = async () => {
    // @ts-ignore
    this.root = await window.showDirectoryPicker({ mode: 'readwrite' })
    // @ts-ignore
    await this.db.handle.put({ name: 'root', handle: this.root }, 'root')
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

export const fsServer = new FileSystemServer()

class FileSystemLowAdapter<T> implements Adapter<T> {
  constructor(private fileName: string) {}
  read = () => {
    return fsServer.readJSON(this.fileName)
  }
  write = async (data: T) => {
    await fsServer.writeJSON(data, this.fileName)
    return
  }
}

interface Database {
  document: (Document & { attributes: Attribute[] })[]
  config: Config[]
  file: IFile[]
}

const defaultData: Database = {
  document: [],
  config: [],
  file: []
}

export const low = new Low<Database>(new FileSystemLowAdapter('meta.json'), defaultData)

