import { Attribute, File } from "@prisma/client"
import type { Post } from "../../shared/types/index.d.ts"
import { createLogger } from "../utils/logger.ts"
import { retryWhenError } from "../utils/index.ts"

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

interface WebhookEndpoint {
  label: string
  url: string
}

const logger = createLogger('webhook')

const getEndpoints = (): WebhookEndpoint[] => {
  return []
}

const createWebhookSender = (endpoint: WebhookEndpoint) => {
  return retryWhenError(async (action: Action) => {
    logger.i(`start send to ${endpoint.url}: ${JSON.stringify(action)}`)
    const response = await fetch(endpoint.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(action)
    })
    logger.i(`end send to ${endpoint.url}: ${response.status}`)
    if (!response.ok) {
      logger.e(`error send to ${endpoint.url}: ${response.status}`)
    }
  })
}

export const sendToEndpoints = (action: Action) => {
  console.log('sendToEndpoint', action)
  const endpoints = getEndpoints()
  endpoints.forEach(endpoint => {
    const sender = createWebhookSender(endpoint)
    sender(action)
  })
}