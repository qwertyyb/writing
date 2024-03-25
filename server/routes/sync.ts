import KoaRouter from '@koa/router';
import { needAuth } from '../middlewares/auth';
import { createRes } from '../utils';
import { SyncService } from '../service/sync';
import { SQLHistory } from '@prisma/client';

const syncService = new SyncService();

const router = new KoaRouter({ prefix: '/api/v1/sync' });

router.use(needAuth);

interface PostBody {
  type: 'send' | 'backup' | 'file',
  records?: SQLHistory[],
  file?: File
}

router
  .get('/endpoint', async (ctx) => {
    ctx.body = createRes(await syncService.getLatest());
  })
  .post('/endpoint', async (ctx) => {
    const { type, records, file } = ctx.body as PostBody;
    if (type === 'backup') {
      // @todo 备份当前数据库
      return;
    }
    if (type === 'file') {
      // @todo 替换当前数据文件
      return;
    }
    if (type === 'send' && records) {
      await syncService.recv(records);
    }
  });