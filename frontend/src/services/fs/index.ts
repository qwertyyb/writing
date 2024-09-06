
import { DocumentService } from "./document";
import { ConfigService } from "./config";
import { AttributeService } from "./attribute";
import { FileService } from "./file";
import { AuthService } from './auth'
import { FileSystemServer } from "./fs";
import type { IAttributeService, IAuthService, IConfigService, IDocumentService, IFileService, IService } from "../types";
import { Low } from "lowdb";
import { defaultData, FileSystemLowAdapter, type Database, type IFileServer } from "./base";
import { LRRWServer } from './LRRW';

interface ILocalFileSystemConfig {
  server: 'fileSystem',
  adapter?: 'local',
  name?: string
}

interface IGithubFileSystemConfig {
  server: 'fileSystem',
  adapter: 'github',
  auth: string,
  owner: string,
  repo: string
}

export type IFileSystemConfig = ILocalFileSystemConfig | IGithubFileSystemConfig

export class FileSystemService implements IService {
  private fsServer: IFileServer
  private low: Low<Database>
  documentService: IDocumentService
  attributeService: IAttributeService
  configService: IConfigService
  fileService: IFileService
  authService: IAuthService

  constructor(private config: IFileSystemConfig) {
    if (config.adapter === 'github' && config.auth) {
      this.fsServer = new LRRWServer(config)
    } else {
      this.fsServer = new FileSystemServer({ name: (config as ILocalFileSystemConfig).name ?? 'default' })
    }
    this.low = new Low(new FileSystemLowAdapter(this.fsServer, 'meta.json'), defaultData())
    this.documentService = new DocumentService(this.fsServer, this.low)
    this.attributeService = new AttributeService(this.low)
    this.configService = new ConfigService(this.low)
    this.fileService = new FileService(this.fsServer, this.low)
    this.authService = new AuthService()
  }

  authDirectory = () => {
    if ('authDirectory' in this.fsServer) {
      return (this.fsServer as FileSystemServer).authDirectory()
    }
  }

  directoryAuthorized = () => {
    if ('directoryAuthorized' in this.fsServer) {
      return (this.fsServer as FileSystemServer).directoryAuthorized()
    }
    return true
  }
}