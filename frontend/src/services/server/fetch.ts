import { ElMessage } from "element-plus"
import { AuthError } from "../types"

export interface ResponseData<D extends any = any> {
  errCode: number,
  errMsg: string,
  data: D
}

export const createFetch = (config: { baseURL: string }) => {
  let baseURL = /^https?:\/\//.test(config.baseURL) ? config.baseURL : location.origin + config.baseURL
  baseURL = baseURL.replace(/\/$/, '')
  return async <D extends any>(...args: Parameters<typeof fetch>) => {
    let response: Response | null = null
    try {
      const token = localStorage.getItem('token')
      const path = args[0] as string;
      const url = baseURL + path
      response = await fetch(url, {
        ...args[1],
        headers: {
          ...args[1]?.headers,
          Authorization: token ? `Bearer ${token}` : ''
        }
      })
    } catch (err: any) {
      const errMsg = `${args[0]}请求失败: ${err.message}`
      ElMessage.error({
        message: errMsg
      })
      throw new Error(errMsg)
    }

    let json: ResponseData<D> | null
    try {
      json = await response.json()
    } catch (err: any) {
      const errMsg =`${args[0]}解析请求结果失败: ${err.message}`
      ElMessage.error({ message: errMsg })
      throw new Error(errMsg)
    }

    if (json?.errCode === 403) {
      throw new AuthError(json.errCode, json.errMsg, 'need auth')
    }

    if (json?.errCode !== 0) {
      const errMsg = `${args[0]}请求错误: ${json!.errMsg}`
      ElMessage.error({ message: errMsg })
      throw new Error(errMsg)
    }
    
    return json!
  }
}
