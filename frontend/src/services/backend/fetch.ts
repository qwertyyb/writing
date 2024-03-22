import router from "@/router"
import { useAuthStore } from "@/stores/auth"
import { ElMessage } from "element-plus"

export interface ResponseData<D extends any> {
  errCode: number,
  errMsg: string,
  data: D
}

export const apiFetch = async <D extends any>(...args: Parameters<typeof fetch>) => {
  let response: Response | null = null
  try {
    response = await fetch(args[0], {
      ...args[1],
      headers: {
        ...args[1]?.headers,
        Authorization: `Bearer ${useAuthStore().token}`
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

  if (json?.errCode === 403 && router.currentRoute.value.name !== 'auth') {
    router.replace({
      name: 'auth',
      query: {
        ru: router.currentRoute.value.fullPath || ''
      }
    })
  }

  if (json?.errCode !== 0) {
    const errMsg = `${args[0]}请求错误: ${json!.errMsg}`
    ElMessage.error({ message: errMsg })
    throw new Error(errMsg)
  }
  
  return json!
}