import type Koa from 'koa'
import { TOKEN } from '../config'
import { createRes } from '../utils'

export const needAuth: Koa.Middleware = async (ctx, next) => {
  if (ctx.request.headers.token === TOKEN) {
    return await next()
  }
  ctx.body = createRes(null, 403, 'need auth')
}