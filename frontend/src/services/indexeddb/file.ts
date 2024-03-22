import { randomString } from "@/utils/utils"
import { db } from "./db"

class FileService {
  upload = async (file: File | Blob) => {
    const name = randomString()
    await db.file.put({
      name,
      content: file,
      createdAt: new Date().toISOString(),
      mimetype: file.type
    })
    // @todo 需要在service worker中拦截一下该请求，返回indexeddb中的文件
    return { data: { url: `/api/v1/indexeddb/file/${name}` } }
  }
}

export const fileService = new FileService()