import router from '@/router'
import { AuthError } from './types'

let service = null
if (import.meta.env.MODE === 'indexeddb') {
  service = await import('./indexeddb')
} else {
  service = await import('./server/index')
}

export const documentService = service.documentService
export const configService = service.configService
export const attributeService = service.attributeService
export const fileService = service.fileService

window.addEventListener('error', (event) => {
  if (event.error instanceof AuthError) {
    if (router.currentRoute.value.name !== 'auth') {
      router.replace({
        name: 'auth',
        query: {
          ru: router.currentRoute.value.fullPath || ''
        }
      })
    }
  }
})