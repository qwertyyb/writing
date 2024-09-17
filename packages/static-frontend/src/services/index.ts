const POST_API_PATH = './server/posts/:id.json'
const LIST_API_PATH = './server/posts/list.json'

export class RequestError extends Error {
  status?: number
}

export const getPost = async (id: string) => {
  const postPATH = POST_API_PATH.replace(/:id/g, id)
  const response = await fetch(postPATH, {
    cache: 'no-cache'
  })
  if (response.ok) {
    return response.json()
  }
  const error = new RequestError(`request post ${id} failed: ${response.status}`)
  error.status = response.status
  throw error
}

export const getList = async () => {
  const response = await fetch(LIST_API_PATH, {
    cache: 'no-cache'
  })
  return response.json()
}