import { createLogger } from "../utils/logger.ts"
import { retryWhenError } from "../utils/index.ts"
import { type Action, ACTION_EVENT_NAME, event } from "./ActionEvent.ts"

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

const sendToEndpoints = (action: Action) => {
  setImmediate(() => {
    logger.i('sendToEndpoint', action)
    const endpoints = getEndpoints()
    endpoints.forEach(endpoint => {
      const sender = createWebhookSender(endpoint)
      sender(action)
    })
  })
}

export const startWebhook = () => {
  event.on(ACTION_EVENT_NAME, sendToEndpoints)
}