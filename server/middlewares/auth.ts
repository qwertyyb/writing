import type Koa from 'koa'
import { JWT_SECRET } from '../config'
import { createRes } from '../utils'
import { base64url, jwtDecrypt } from 'jose'

export const needAuth: Koa.Middleware = async (ctx, next) => {
  if (!ctx.request.header.authorization) {
    ctx.body = createRes(null, 403, 'need auth')
  }
  try {
    const token = ctx.request.header.authorization.replace(/^Bearer\s/, '')
    const jwt = await jwtDecrypt(token, base64url.decode(JWT_SECRET), {
      audience: 'client:web',
      issuer: 'server',
    })
  } catch (err) {
    console.error(err)
    ctx.body = createRes(null, 403, 'auth failed')
    return
  }
  return await next()
}