import type Koa from 'koa'
import { createRes } from '../utils'

export const fallback: Koa.Middleware = async (ctx, next) => {
  try {
    await next()
    const status = ctx.status || 404
    if (status === 404) {
      ctx.body = createRes(null, 404, 'Not Found')
    }
  } catch (err) {
    console.error(err)
    ctx.body = createRes(null, err.status || 500, err.message)
  }
}