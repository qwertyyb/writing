import { getImageRatio } from "@/components/blocks/image/utils"
import * as uploadService from '@/services/upload';
import { ref } from "vue"

export const useUpload = () => {
  const uploadState = ref({
    loading: false,
    text: '',
    tempUrl: '',
    tempRatio: 1,
  })

  const uploadImageFile = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    return new Promise((resolve) => {
      input.addEventListener('change', async () => {
        const files = input.files
        if (!files?.length) return

        const url = URL.createObjectURL(files[0])
        const { ratio } = await getImageRatio(url)
        uploadState.value.tempUrl = url
        uploadState.value.tempRatio = ratio

        uploadState.value.loading = true
        uploadState.value.text = ''
        uploadService.upload(files[0]).then(async (result) => {
          if (result.errCode === 0) {
            resolve({ url: result.data.url, ratio })
            uploadState.value.loading = false
          } else {
            uploadState.value.text = result.errMsg || '上传失败'
          }
        })
      })
      input.click()
    })
  }

  const uploadBlob = async (content: File | Blob) => {
    const url = URL.createObjectURL(content)
    const { ratio } = await getImageRatio(url)
    uploadState.value.tempUrl = url
    uploadState.value.tempRatio = ratio

    uploadState.value.loading = true
    uploadState.value.text = ''
    return uploadService.upload(content).then(async (result) => {
      if (result.errCode === 0) {
        uploadState.value.loading = false
        return { url: result.data.url, ratio }
      } else {
        uploadState.value.text = result.errMsg || '上传失败'
        throw new Error(result.errMsg || '上传失败')
      }
    })
  }

  return { state: uploadState, uploadImageFile, uploadBlob } 
}