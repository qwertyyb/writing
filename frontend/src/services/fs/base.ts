import type { Adapter } from "lowdb"
import type { IDocument, IConfig, IAttribute, IFile,  } from "../types"

export interface Database {
  document: (IDocument & { attributes: IAttribute[] })[]
  config: IConfig[]
  file: IFile[]
}

export interface IFileServer {
  removeFile: (path: string) => Promise<void>
  writeJSON: (json: any, path: string) => any
  readJSON: (path: string) => Promise<any>
  readFile: (path: string) => Promise<Blob | null>
  writeFile: (content: Blob | File, path: string) => any
}

export const defaultData = (): Database => ({
  document: [],
  config: [],
  file: []
})

export class FileSystemLowAdapter<T> implements Adapter<T> {
  constructor(private fsServer: IFileServer, private fileName: string) {}
  read = () => {
    return this.fsServer.readJSON(this.fileName)
  }
  write = async (data: T) => {
    await this.fsServer.writeJSON(data, this.fileName)
    return
  }
}