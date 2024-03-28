import KoaRouter from '@koa/router';
// import { needAuth } from '../middlewares/auth';
import { createRes } from '../utils';
import { SQLHistory } from '@prisma/client';
import type { File } from 'formidable';
import { localService } from '../service/sync';
import { SYNC_KEY } from '../const';

const router = new KoaRouter({ prefix: '/api/v1/sync' });

router.use(async (ctx, next) => {
  const { key } = ctx.request.query;
  if (!key || key !== SYNC_KEY) {
    ctx.body = createRes(null, 403, 'SYNC_KEY不正确,无法同步');
    return;
  }
  await next();
});

interface PostBody {
  type: 'push' | 'file',
  records?: SQLHistory[],
  file?: File,
}

router
  .get('/endpoint', async (ctx) => {
    ctx.body = createRes(await localService.getLatest());
  })
  .post('/endpoint', async (ctx) => {
    const { type, records } = ctx.request.body as PostBody;
    if (type === 'file' && ctx.request.files?.file) {
      ctx.body = createRes(await localService.replace(ctx.request.files?.file as File));
      return;
    }
    if (type === 'push' && records) {
      const success = await localService.recv(records);
      ctx.body = createRes({ success });
    }
  });

export default router;
