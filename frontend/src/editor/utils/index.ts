export const selectFile = (accept: string) => {
  return new Promise<File>(resolve => {
    const input = document.createElement('input')
    input.type = 'file'
    if (accept) {
      input.accept = accept
    }
    input.addEventListener('change', () => {
      const file = input.files?.item(0)
      if (!file) return;
      resolve(file)
    })
    input.click()
  })
}

export const getImageSize = (imageUrl: string) => {
  return new Promise<{ width: number, height: number }>((resolve, reject) => {
    const image = new Image()
    image.addEventListener('load', () => {
      resolve({ width: image.naturalWidth, height: image.naturalHeight })
    })
    image.addEventListener('error', (err) => {
      reject(err)
    })
    image.src = imageUrl
  })
}