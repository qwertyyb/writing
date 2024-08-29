import { FileSystemService, type IFileSystemConfig } from './fs'
import { IndexedDBService, type IIndexedDBConfig } from './indexeddb'
import { WritingServerService, type IWritingServerConfig } from './server'

export type ServerConfig = IWritingServerConfig | IIndexedDBConfig | IFileSystemConfig

export const createService = (config: ServerConfig) => {
  if (config.server === 'fileSystem') {
    return new FileSystemService(config)
  }
  if (config.server === 'indexedDB') {
    return new IndexedDBService()
  }
  if (config.server === 'writingServer' && config.baseURL) {
    return new WritingServerService(config)
  }
  throw new Error('wrong server config')
}