import KoaRouter from '@koa/router'
import { needAuth } from '../middlewares/auth.ts'
import { createRes } from '../utils/index.ts'
import { getPostWithAttrs, prisma } from '../prisma.ts'
import { ACTION_EVENT_NAME, event } from '../service/ActionEvent.ts'

const router = new KoaRouter({ prefix: '/api/v1/attribute' })

router.use(needAuth)

router
  .patch('/update', async (ctx) => {
    const { docId, attributes } = ctx.request.body as ({ docId: number, attributes: {key: string, value: string }[] });
    if (!docId || attributes.some(attr => !attr.key)) {
      ctx.body = createRes(null, 400, '未传入id或key')
      return
    }
    const results = await Promise.all(attributes.map(attr => prisma.attribute.upsert({
      where: { docId_key: { docId, key: attr.key } },
      create: { docId, key: attr.key, value: attr.value },
      update: { value: attr.value }
    })))
    ctx.body = createRes(results)
    setImmediate(async () => {
      event.emit(ACTION_EVENT_NAME, {
        type: 'updatePost',
        payload: await getPostWithAttrs(docId)
      })
    })
  })

export default router
