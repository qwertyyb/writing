import { type File } from '@prisma/client'
import EventEmitter from "node:events";
import type { Post } from "../../shared/types/index.d.ts"

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

export type Action = AddPostAction | UpdatePostAction | RemovePostAction | MovePostAction | AddFileAction | RemoveFileAction

export const ACTION_EVENT_NAME = 'action'

export const event = new EventEmitter()