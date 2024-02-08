export const getImageRatio = (url: string): Promise<{src: string, ratio: number}> => {
  return new Promise((resolve) => {
    const image = document.createElement('img')
    image.onload = () => {
      resolve({ src: url, ratio: image.naturalWidth / image.naturalHeight })
    }
    image.src = url
  })
}