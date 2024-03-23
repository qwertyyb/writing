import KoaRouter from '@koa/router';
import { readFileSync } from 'node:fs';
import { needAuth } from '../middlewares/auth';
import { orm } from '../typeorm/schema';

const router = new KoaRouter();

router.post('/api/v1/upload', needAuth, async (ctx) => {
  const file = Array.isArray(ctx.request.files?.file) ? ctx.request.files?.file[0] : ctx.request.files?.file;
  if (!file) {
    ctx.body = {
      errCode: 400,
      errMsg: '请求中未发现文件',
    };
    return;
  }
  await orm.file.insert({
    name: file.newFilename,
    mimetype: file.mimetype,
    content: readFileSync(file.filepath),
    createdAt: new Date(),
  });
  const data = await orm.file.findOne({ where: { name: file.newFilename }, select: ['name'] });
  ctx.body = {
    errCode: 0,
    errMsg: 'ok',
    data: {
      url: `/api/v1/file?name=${encodeURIComponent(data.name)}`,
    },
  };
});

router.get('/api/v1/file', async (ctx) => {
  const name = ctx.request.query.name as string;
  if (!name) {
    ctx.body = {
      errCode: 400,
      errMsg: 'name未发现',
    };
    return;
  }
  const record = await orm.file.findOne({
    where: {
      name,
    },
  });
  ctx.set('content-type', record.mimetype);
  ctx.body = record.content;
});

export default router;
