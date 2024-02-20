import KoaRouter from '@koa/router';
import { prisma } from '../prisma';
import { createRes } from '../utils';
import { needAuth } from '../middlewares/auth';

const router = new KoaRouter({ prefix: '/api/v1/document' })

router.use(needAuth)

router
  .get('/list', async (ctx) => {
    const { where = {} } = ctx.query
    const [total, list] = await Promise.all([
      prisma.document.count({ where }),
      prisma.document.findMany({
        where: { deleted: false, ...where },
        select: { id: true, path: true, title: true, updatedAt: true, createdAt: true, deleted: true, deletedAt: true }
      })
    ])
    ctx.body = createRes({ total, list })
  })
  .get('/query', async (ctx) => {
    const id = Number(ctx.query.id)
    if (!id) {
      ctx.body = {
        errCode: 400,
        errMsg: '未传入参数id'
      }
      return
    }
    const document = await prisma.document.findUnique({
      where: { id },
      include: { attributes: true }
    })
    ctx.body = createRes(document)
  })
  .patch('/update', async (ctx, next) => {
    const id = Number(ctx.request.body.id)
    const { path, title, content } = ctx.request.body
    if (!id) {
      ctx.body = createRes(null, 400, '未传入参数id')
      return
    }
    if (!path && !title && !content) {
      ctx.body = createRes(null, 400, 'path、title、content不能全为空')
      return
    }
    const data = await prisma.document.update({
      where: { id },
      data: {
        title, path, content
      },
      select: {
        id: true, title: true, path: true
      }
    })
    ctx.body = createRes(data)
  })
  .del('/remove', async (ctx) => {
    let id = Number(ctx.query.id)
    let path = ctx.query.path as string
    if (!id && !path) {
      ctx.body = createRes(null, 400, '未传入id或path')
      return
    }
    // 删除需要把子文档也删除
    if (!path) {
      const node = await prisma.document.findUnique({ where: { id } })
      path = `${node.path}/${node.id}`
    } else if(!id) {
      id = Number(path.split('/').pop())
    }
    const result = await prisma.document.updateMany({
      where: { OR: [{ path }, { id }] },
      data: { deleted: true, deletedAt: new Date() },
    })
    ctx.body = createRes(result)
  })
  .post('/add', async (ctx, next) => {
    const { title, content, path } = await ctx.request.body
    const record = await prisma.document.create({
      data: {
        title, content, path
      },
      select: {
        title: true, path: true, id: true, createdAt: true, updatedAt: true,
      }
    })
    ctx.body = createRes(record)
  })

  export default router
