import KoaRouter from '@koa/router'
import { readFileSync } from 'node:fs'
import { prisma } from '../prisma'
import { needAuth } from '../middlewares/auth'

const router = new KoaRouter()

router.use(needAuth)

router.post('/api/v1/upload', async (ctx, next) => {
  const file = Array.isArray(ctx.request.files?.file) ? ctx.request.files?.file[0] : ctx.request.files?.file
  if (!file) {
    ctx.body = {
      errCode: 400,
      errMsg: '请求中未发现文件'
    }
    return
  }
  const data = await prisma.file.create({
    data: {
      name: file.newFilename,
      mimetype: file.mimetype,
      content: readFileSync(file.filepath),
      createdAt: new Date()
    },
    select: {
      name: true,
      mimetype: true,
      createdAt: true,
    }
  })
  ctx.body = {
    errCode: 0,
    errMsg: 'ok',
    data: {
      ...data,
      url: '/api/v1/file?name=' + encodeURIComponent(data.name)
    }
  }
})

router.get('/api/v1/file', async (ctx, next) => {
  const name = ctx.request.query.name as string
  if (!name) {
    ctx.body = {
      errCode: 400,
      errMsg: 'name未发现'
    }
    return
  }
  const record = await prisma.file.findUnique({
    where: {
      name
    }
  })
  ctx.set('content-type', record.mimetype)
  ctx.body = record.content
})

export default router