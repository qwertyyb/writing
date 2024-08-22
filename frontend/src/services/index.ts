import { type IAttributeService, type IConfigService, type IDocumentService, type IFileService } from './types'

let service = null
// if (import.meta.env.VITE_DATABASE === 'indexeddb') {
//   service = await import('./indexeddb')
// } else if (import.meta.env.VITE_DATABASE === 'filesystem') {
  service = await import('./fs')
// } else {
//   service = await import('./server/index')
// }

export const documentService = service.documentService as IDocumentService
export const configService = service.configService as IConfigService
export const attributeService = service.attributeService as IAttributeService
export const fileService = service.fileService as IFileService
export const authService = service.authService
