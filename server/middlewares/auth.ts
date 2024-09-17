import type Koa from 'koa'
import { JWT_SECRET } from '../config.ts'
import { createRes } from '../utils/index.ts'
import { base64url, jwtDecrypt } from 'jose'

export const checkLogin = async (ctx: Koa.DefaultContext) => {
  if (!ctx.request.header.authorization) {
    return false
  }
  try {
    const token = ctx.request.header.authorization.replace(/^Bearer\s/, '')
    const jwt = await jwtDecrypt(token, base64url.decode(JWT_SECRET), {
      audience: 'client:web',
      issuer: 'server',
    })
  } catch (err) {
    console.error(err)
    return false
  }
  return true
}

export const needAuth: Koa.Middleware = async (ctx, next) => {
  if (!await checkLogin(ctx)) {
    ctx.body = createRes(null, 403, 'auth failed')
    return
  }
  return await next()
}