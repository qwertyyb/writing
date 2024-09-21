import { IWritingNote } from "@writing/types"

export const getFilePaths = (note: IWritingNote) => {
  const reg = /\/api\/v1\/file\?name=([^"]+)/g
  const pathList = [...note.content.matchAll(reg)]
  return pathList.map((match) => ({ path: match[0], name: match[1] }))
}

export const transformFiles = async (note: IWritingNote) => {
  const filePaths = getFilePaths(note)
  const fileContents = (await Promise.allSettled(filePaths.map(async (filePath) => {
    const response = await fetch(`http://localhost:${4080}${filePath.path}`)
    if (response.ok) {
      return {
        ...filePath,
        blob: await response.blob()
      }
    }
    throw new Error('request file failed')
  })))
    .map(item => item.status === 'fulfilled' && item.value)
    .filter(Boolean) as { path: string, name: string, blob: Blob }[]
  return {
    files: fileContents,
    note: {
      ...note,
      content: filePaths.reduce((content, file) => {
        return content.replaceAll(file.path, `./server/posts/${note.id}/files/${file.name}`)
      }, note.content)
    }
  }
}