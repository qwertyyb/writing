import KoaRouter from '@koa/router'
import { needAuth } from '../middlewares/auth.ts'
import { createRes, parseAttr } from '../utils/index.ts'
import { getPostWithAttrs, prisma } from '../prisma.ts'
import { ACTION_EVENT_NAME, event } from '../service/ActionEvent.ts'
import { IWritingAttribute } from '@writing/types'

const router = new KoaRouter({ prefix: '/api/v1/attribute' })

router.use(needAuth)

router
  .patch('/update', async (ctx) => {
    const { docId, attributes } = ctx.request.body as ({ docId: number, attributes: IWritingAttribute[] });
    if (!docId || attributes.some(attr => !attr.key)) {
      ctx.body = createRes(null, 400, '未传入id或key')
      return
    }
    const attrs = attributes.map(attr => ({ ...attr, options: attr.options ? JSON.stringify(attr.options) : null }))
    const results = await Promise.all(attrs.map(attr => prisma.attribute.upsert({
      where: { docId_key: { docId, key: attr.key } },
      create: { docId, key: attr.key, value: attr.value, options: attr.options },
      update: { value: attr.value, options: attr.options }
    })))
    ctx.body = createRes(results.map(parseAttr))
    setImmediate(async () => {
      event.emit(ACTION_EVENT_NAME, {
        type: 'updatePost',
        payload: await getPostWithAttrs(docId)
      })
    })
  })
  .post('/remove', async (ctx) => {
    const { docId, keys } = ctx.request.body as { docId: number, keys: string[] }
    if (!docId || !keys?.length) {
      ctx.body = createRes(null, 400, '未传入id或keys')
      return
    }
    await prisma.attribute.deleteMany({
      where: { docId, key: { in: keys } }
    })
    ctx.body = createRes(null)
    setImmediate(async () => {
      event.emit(ACTION_EVENT_NAME, {
        type: 'updatePost',
        payload: await getPostWithAttrs(docId)
      })
    })
  })

export default router
