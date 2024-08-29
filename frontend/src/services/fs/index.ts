
import { DocumentService } from "./document";
import { ConfigService } from "./config";
import { AttributeService } from "./attribute";
import { FileService } from "./file";
import { AuthService } from './auth'
import { defaultData, FileSystemLowAdapter, FileSystemServer, type Database } from "./fs";
import type { IAttributeService, IAuthService, IConfigService, IDocumentService, IFileService, IService } from "../types";
import { Low } from "lowdb";

export interface IFileSystemConfig {
  server: 'fileSystem'
  name?: string
}

export class FileSystemService implements IService {
  private fsServer: FileSystemServer
  private low: Low<Database>
  documentService: IDocumentService
  attributeService: IAttributeService
  configService: IConfigService
  fileService: IFileService
  authService: IAuthService

  constructor(private config: IFileSystemConfig) {
    this.fsServer = new FileSystemServer({ name: config.name ?? 'default' })
    this.low = new Low(new FileSystemLowAdapter(this.fsServer, 'meta.json'), defaultData())
    this.documentService = new DocumentService(this.fsServer, this.low)
    this.attributeService = new AttributeService(this.low)
    this.configService = new ConfigService(this.low)
    this.fileService = new FileService(this.fsServer, this.low)
    this.authService = new AuthService()
  }

  authDirectory = () => {
    return this.fsServer.authDirectory()
  }

  directoryAuthorized = () => {
    return this.fsServer.directoryAuthorized()
  }
}