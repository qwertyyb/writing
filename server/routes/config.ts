import KoaRouter from '@koa/router';
import { createRes } from '../utils';
import { prisma } from '../prisma';

const router = new KoaRouter({ prefix: '/api/v1/config' });

router
  .post('/update', async (ctx) => {
    const { key, value } = ctx.request.body as { key: string, value: string };
    if (!key) {
      ctx.body = createRes(null, 400, '未传入key');
      return;
    }
    const result = await prisma.config.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });
    ctx.body = createRes(result);
  })
  .get('/get', async (ctx) => {
    const key = ctx.request.query.key as string;
    if (!key) {
      ctx.body = createRes(null, 400, '未传入key');
      return;
    }
    const result = await prisma.config.findUnique({
      where: { key },
    });
    ctx.body = createRes(result);
  })
  .get('/gets', async (ctx) => {
    const param = ctx.request.query.keys as string;
    if (!param) {
      ctx.body = createRes(null, 400, '未传入keys');
      return;
    }
    const keys = JSON.parse(param) as string[];
    if (!keys.length) {
      ctx.body = createRes(null, 400, '未传入keys');
      return;
    }
    const result = await prisma.config.findMany({
      where: { key: { in: keys } },
    });
    ctx.body = createRes(result);
  });

export default router;
