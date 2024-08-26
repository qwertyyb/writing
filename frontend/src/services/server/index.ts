import { DocumentService } from "./document";
import { ConfigService } from "./config";
import { AttributeService } from "./attribute";
import { FileService } from "./file";
import { AuthService } from './auth'
import type { IAttributeService, IAuthService, IConfigService, IDocumentService, IFileService, IService } from "../types";
import { createFetch } from "./fetch";

export interface IWritingServerConfig {
  server: 'writingServer'
  baseURL: ''
}

export class WritingServerService implements IService {
  private fetch: ReturnType<typeof createFetch>
  documentService: IDocumentService;
  configService: IConfigService;
  attributeService: IAttributeService;
  fileService: IFileService;
  authService: IAuthService;

  constructor(config: IWritingServerConfig) {
    this.fetch = createFetch(config)
    this.documentService = new DocumentService(this.fetch)
    this.configService = new ConfigService(this.fetch)
    this.attributeService = new AttributeService(this.fetch)
    this.fileService = new FileService(this.fetch)
    this.authService = new AuthService(this.fetch)
  }
}