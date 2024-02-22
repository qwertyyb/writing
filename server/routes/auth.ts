import KoaRouter from '@koa/router'
import { base64url, EncryptJWT } from 'jose'
import { createRes } from '../utils'
import { JWT_SECRET, TOKEN } from '../config'

const authRouter = new KoaRouter({ prefix: '/api/v1/auth' })

authRouter.post('/login', async (ctx) => {
  const { password } = ctx.request.body
  if (!password) {
    ctx.body = createRes(null, 400, '未传入密码')
    return
  }
  if (password !== TOKEN) {
    ctx.body = createRes(null, 400, '密码不正确')
    return
  }
  const secret = base64url.decode(JWT_SECRET)
  const jwt = await new EncryptJWT()
    .setProtectedHeader({ alg: 'dir', enc: 'A128CBC-HS256' })
    .setIssuedAt()
    .setIssuer('server')
    .setAudience('client:web')
    .setExpirationTime('180days')
    .encrypt(secret)

  ctx.body = createRes({token: jwt})
})

export default authRouter