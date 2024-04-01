import KoaRouter from '@koa/router';
import { readFileSync } from 'node:fs';
import { prisma } from '../prisma';
import { needAuth } from '../middlewares/auth';
import { createRes } from '../utils';
import { fileService } from '../service/fileService';

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
  const data = await prisma.file.create({
    data: {
      name: file.newFilename,
      mimetype: file.mimetype,
      content: readFileSync(file.filepath),
      createdAt: new Date(),
    },
    select: {
      name: true,
      mimetype: true,
      createdAt: true,
    },
  });
  ctx.body = {
    errCode: 0,
    errMsg: 'ok',
    data: {
      ...data,
      url: `/api/v1/file?name=${encodeURIComponent(data.name)}`,
    },
  };
});


router.get('/api/v1/file/check', async ctx => {
  const { start, end, mimetype } = ctx.request.query as Partial<{ start: string, end: string, mimetype: string }>;
  const query: any = { mimetype };
  start && (query.start = new Date(start));
  end && (query.end = new Date(end));
  ctx.body = createRes(await fileService.check(query));
});

router.post('/api/v1/file/remove', async (ctx) => {
  const names = ctx.request.body.names as string[];
  if (!names?.length) {
    ctx.body = createRes(null, 400, '未传入names参数');
    return;
  }
  const result = await prisma.file.deleteMany({
    where: {
      name: {
        in: names
      }
    }
  });
  ctx.body = createRes(result);
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
  const record = await prisma.file.findUnique({
    where: {
      name,
    },
  });
  ctx.set('content-type', record.mimetype);
  ctx.body = record.content;
});

export default router;
