import KoaRouter from '@koa/router'

const router = new KoaRouter({ prefix: '/api/v1/plugin' })

router.post('/fetch', async (ctx) => {
  const { args } = ctx.request.body as { args: Parameters<typeof fetch> }
  const response = await fetch(args[0], args[1])
  ctx.status = response.status
  // const text = await response.text()
  // console.log(text)
  response.headers.forEach((value, key) => {
    ctx.set(key, value)
  })
  ctx.flushHeaders()
  for await (const chunk of response.body!) {
    ctx.res.write(chunk)
  }
  ctx.res.end()
})

export default router
