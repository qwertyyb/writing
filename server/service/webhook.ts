import { Attribute, File } from "@prisma/client"
import { Post } from "../../shared/types"

interface AddPostAction {
  type: 'addPost',
  payload: Post
}

interface UpdatePostAction {
  type: 'updatePost',
  payload: Post
}

interface RemovePostAction {
  type: 'removePost',
  payload: { id: number }
}

interface MovePostAction {
  type: 'movePost',
  payload: {
    data: { id: number, path: string, nextId: number | null }[]
  }
}

interface AddFileAction {
  type: 'addFile',
  payload: File
}

interface RemoveFileAction {
  type: 'removeFile',
  payload: { names: string[] }
}

type Action = AddPostAction | UpdatePostAction | RemovePostAction | MovePostAction | AddFileAction | RemoveFileAction

const getEndpoints = (): string[] => {
  return []
}

export const sendToEndpoints = (action: Action) => {
  console.log('sendToEndpoint', action)
  if (action.type === 'updatePost') {
    
  }
}