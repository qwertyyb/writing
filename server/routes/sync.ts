import KoaRouter from '@koa/router';
// import { needAuth } from '../middlewares/auth';
import { createRes } from '../utils';
import { SQLHistory } from '@prisma/client';
import type { File } from 'formidable';
import { localService } from '../service/sync';

const router = new KoaRouter({ prefix: '/api/v1/sync' });

// router.use(needAuth);

interface PostBody {
  type: 'push' | 'backup' | 'file',
  records?: SQLHistory[],
  file?: File
}

router
  .get('/endpoint', async (ctx) => {
    ctx.body = createRes(await localService.getLatest());
  })
  .post('/endpoint', async (ctx) => {
    const { type, records } = ctx.request.body as PostBody;
    if (type === 'backup') {
      ctx.body = createRes(await localService.backup());
      return;
    }
    if (type === 'file') {
      ctx.body = createRes(await localService.replace(ctx.request.files?.file as File));
      return;
    }
    if (type === 'push' && records) {
      ctx.body = createRes(await localService.recv(records));
    }
  });

export default router;
