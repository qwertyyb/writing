import { FileSystemService, type IFileSystemConfig } from './fs'
import { IndexedDBService } from './indexeddb'
import { WritingServerService, type IWritingServerConfig } from './server'
import type { IService } from './types'

interface IndexedDBConfig {
  server: 'indexedDB'
}

type ServerConfig = IWritingServerConfig | IndexedDBConfig | IFileSystemConfig

const createServicesProxy = <K extends keyof IService>(
  services: IService[],
  name: K
): IService[K] => {
  return new Proxy({} as any, {
    get(target, p, receiver) {
      return (...args: any[]) => {
        const results = services.map(service => {
          // @ts-ignore
          return service[name][p]?.(...args)
        })
        return results[0]
      }
    },
  })
}

export const createService = (servicesConfig: ServerConfig[]): IService => {
  const services: IService[] = servicesConfig.map(config => {
    if (config.server === 'fileSystem') {
      return new FileSystemService(config)
    }
    if (config.server === 'indexedDB') {
      return new IndexedDBService()
    }
    if (config.server === 'writingServer' && config.baseURL) {
      return new WritingServerService(config)
    }
  }).filter(i => !!i)
  return {
    documentService: createServicesProxy(services, 'documentService'),
    configService: createServicesProxy(services, 'configService'),
    attributeService: createServicesProxy(services, 'attributeService'),
    fileService: createServicesProxy(services, 'fileService'),
    authService: createServicesProxy(services, 'authService'),
  }
}