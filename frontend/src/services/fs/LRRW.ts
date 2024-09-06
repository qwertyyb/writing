// LRRW = local read remote write

import { type Database, type IFileServer } from './base'
import { IndexedDBServer } from './indexeddb'
import { GithubServer } from './github'

interface WriteJSONOp {
  op: 'writeJSON'
  path: string
  content: any
  ctime?: string
}

interface WriteBlobOp {
  op: 'writeFile'
  path: string
  content: Blob
  ctime?: string
}

interface RemoveOp {
  op: 'removeFile'
  path: string
  ctime?: string
}

type ModifyOp = WriteJSONOp | WriteBlobOp | RemoveOp

class ModifyLogs {
  private logs: ModifyOp[] = []

  constructor(private options: { cosumeInterval: 3000, consume: (log: ModifyOp) => boolean | Promise<boolean> }) {
    this.resetNextConsume()
  }

  private consumeTimeout: ReturnType<typeof setTimeout> | null = null
  private resetNextConsume = () => {
    if (this.consumeTimeout) {
      clearTimeout(this.consumeTimeout)
    }
    this.consumeTimeout = setTimeout(this.cosume, this.options.cosumeInterval)
  }

  private cosume = async () => {
    const firstLog = this.logs[0]
    if (!firstLog) {
      return this.resetNextConsume()
    }
    let result: boolean = false
    try {
      result = await this.options.consume(firstLog)
    } catch (err) {
      result = false
      console.error(err)
    }
    if (result) {
      this.logs.shift()
    }
    this.resetNextConsume()
  }

  normalize() {
    // 合并日志，合并规则如下
    // 1. 从后往前合并
    // 2. 如果一个文件已被删除(op=removeFile)，则忽略所有后续的更新(op=writeFile 或 op=writeJSON)
    // 3. 如果一个文件被更新（op=writeFile 或 op=writeJSON），则忽略后续所有更新
    const results: ModifyOp[] = []
    const temp: Record<string, ModifyOp["op"]> = {}
    for(let i = this.logs.length - 1; i >= 0; i -= 1) {
      const log = this.logs[i]
      const newestOp = temp[log.path]
      if (!newestOp) {
        temp[log.path] = log.op
        results.unshift(log)
        continue
      } else if (newestOp === 'removeFile' || (newestOp.startsWith('write') && log.op.startsWith('write'))) {
        continue
      } else if (newestOp.startsWith('write') && log.op === 'removeFile') {
        throw new Error('删除后无法更新')
      }
    }
    this.logs = results
  }

  push(command: ModifyOp) {
    const op = { ...command, ctime: new Date().toISOString() } as ModifyOp
    this.logs.push(op)
    this.normalize()
    this.resetNextConsume()
  }

  empty() {
    return !this.logs.length
  }
}

export class LRRWServer implements IFileServer {
  private remoteServer: GithubServer
  private localServer = new IndexedDBServer()

  private modifyLogs: ModifyLogs
  constructor(private options: { auth: string, owner: string, repo: string }) {
    this.remoteServer = new GithubServer(options)
    this.modifyLogs = new ModifyLogs({
      cosumeInterval: 3000,
      consume: this.syncToRemoteServer
    })
    setTimeout(this.syncToRemoteServer, 1000)
  }

  syncToRemoteServer = async (log: ModifyOp) => {
    if (log.op === 'writeFile') {
      await this.remoteServer.writeFile(log.content, log.path)
      return true
    } else if (log.op === 'writeJSON') {
      await this.remoteServer.writeJSON(log.content, log.path)
      return true
    } else if (log.op === 'removeFile') {
      await this.remoteServer.removeFile(log.path)
      return true
    }
    return false
  }

  async removeFile (path: string) {
    await this.localServer.removeFile(path)
    this.modifyLogs.push({ op: 'removeFile', path })
  }
  async writeJSON (json: any, path: string) {
    await this.localServer.writeJSON(json, path)
    this.modifyLogs.push({ op: 'writeJSON', path, content: json })
  }
  async readJSON (path: string) {
    const json = await this.localServer.readJSON(path)
    return json
  }
  async readFile (path: string) {
    const file = await this.localServer.readFile(path)
    return file
  }
  async writeFile (content: Blob | File, path: string) {
    await this.localServer.writeFile(content, path)
    this.modifyLogs.push({ op: 'writeFile', path, content })
  }
}