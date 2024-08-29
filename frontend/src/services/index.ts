import { createService, type ServerConfig } from './service'
import type { IService } from './types'

// @ts-ignore
export let service: IService = null

// export const service = createService([{ server: 'indexedDB' }])
export const LocalStorageKey = 'serverConfig'

export const initService = () => {
  const local = localStorage.getItem(LocalStorageKey)
  if (!local) return null
  const config: ServerConfig = JSON.parse(local)
  service = createService(config)
  return service
}

initService()
