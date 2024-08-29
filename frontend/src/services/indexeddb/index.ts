
import { documentService } from "./document";
import { configService } from "./config";
import { attributeService } from "./attribute";
import { fileService } from "./file";
import { authService } from './auth'
import type { IAttributeService, IAuthService, IConfigService, IDocumentService, IFileService, IService } from "../types";

export interface IIndexedDBConfig {
  server: 'indexedDB'
}

export class IndexedDBService implements IService {
  documentService: IDocumentService = documentService
  configService: IConfigService = configService
  attributeService: IAttributeService = attributeService
  fileService: IFileService = fileService
  authService: IAuthService = authService
}