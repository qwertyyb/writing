import KoaRouter from '@koa/router';
import { getPostWithAttrs, prisma } from '../prisma.ts';
import { createRes } from '../utils/index.ts';
import { needAuth } from '../middlewares/auth.ts';
import type { PostWithContent } from '../../shared/types/index.d.ts';
import { ACTION_EVENT_NAME, event } from '../service/ActionEvent.ts';

const router = new KoaRouter({ prefix: '/api/v1/post' });

router.use(needAuth);

router
  .get('/list', async (ctx) => {
    const { where = {} } = ctx.query;
    const [total, list] = await Promise.all([
      prisma.document.count({ where }),
      prisma.document.findMany({
        where: { deleted: false, ...where },
        select: {
          id: true, path: true, title: true, updatedAt: true, createdAt: true, deleted: true, deletedAt: true, nextId: true, attributes: true,
        },
      }),
    ]);
    const notes = list.map(item => ({
      ...item,
      attributes: item.attributes.map(attr => ({
        ...attr,
        options: attr.options ? JSON.parse(attr.options) : attr.options
      }))
    }))
    ctx.body = createRes({ total, list: notes });
  })
  .get('/query', async (ctx) => {
    const id = Number(ctx.query.id);
    if (!id) {
      ctx.body = {
        errCode: 400,
        errMsg: '未传入参数id',
      };
      return;
    }
    const document = await prisma.document.findUnique({
      where: { id },
      include: { attributes: true },
    });
    ctx.body = createRes({
      ...document,
      attributes: document?.attributes.map(attr => ({ ...attr, options: attr.options ? JSON.parse(attr.options) : attr.options })) || []
    });
  })
  .patch('/update', async (ctx) => {
    const body = ctx.request.body as Pick<PostWithContent, 'id' | 'title' | 'content'>;
    const id = Number(body.id);
    const { title, content } = body;
    if (!id) {
      ctx.body = createRes(null, 400, '未传入参数id');
      return;
    }
    if (!title && !content) {
      ctx.body = createRes(null, 400, 'path、title、content、attributes不能全为空');
      return;
    }
    const data = await prisma.document.update({
      where: { id },
      data: {
        title, content,
      },
      select: {
        id: true, title: true, path: true,
      },
    });
    ctx.body = createRes(data);
    setImmediate(async () => {
      event.emit(ACTION_EVENT_NAME, {
        type: 'updatePost',
        payload: await getPostWithAttrs(data.id)
      })
    })
  })
  .patch('/move', async (ctx) => {
    const updates = ctx.request.body as { id: number, path: string, nextId: number | null }[];
    if (!updates || !updates.length) {
      ctx.body = createRes(null, 400, '未传入参数');
      return;
    }
    const resetList = updates.map((item) => ({ ...item, nextId: null }));
    const result = await prisma.$transaction([...resetList, ...updates].map((item) => prisma.document.update({ where: { id: item.id }, data: { path: item.path, nextId: item.nextId } })));
    ctx.body = createRes(result);
    setImmediate(async () => {
      event.emit(ACTION_EVENT_NAME, {
      type: 'movePost',
        payload: {
          data: updates
        }
      })
    })
  })
  .del('/remove', async (ctx) => {
    const id = Number(ctx.query.id);
    if (!id) {
      ctx.body = createRes(null, 400, '未传入id');
      return;
    }
    // 删除需要把子文档也删除
    const node = await prisma.document.findUnique({ where: { id } });
    if (!node) {
      ctx.body = createRes(null)
      return
    }
    const path = `${node.path}/${node.id}`;

    const result = await prisma.$transaction([
      prisma.document.updateMany({
        where: { OR: [{ path: { startsWith: path } }, { id }] },
        data: { deleted: true, deletedAt: new Date(), nextId: null },
      }),
      prisma.document.updateMany({
        where: { nextId: id },
        data: { nextId: node.nextId },
      }),
    ]);
    ctx.body = createRes(result);
    setImmediate(async () => {
      event.emit(ACTION_EVENT_NAME, {
        type: 'removePost',
        payload: await getPostWithAttrs(id)
      })
    })
  })
  .post('/add', async (ctx) => {
    const { title, content, path } = ctx.request.body;
    const record = await prisma.document.create({
      data: {
        title, content, path,
      },
      select: {
        title: true, path: true, id: true, createdAt: true, updatedAt: true, nextId: true,
      },
    });
    ctx.body = createRes(record);
    setImmediate(async () => {
      event.emit(ACTION_EVENT_NAME, {
        type: 'addPost',
        payload: await getPostWithAttrs(record.id)
      })
    })
  })
  .patch('/publish', async (ctx) => {
    const id = Number(ctx.request.body.id)
    if (!id) {
      ctx.body = createRes(null, 400, '未传入id');
      return
    }
    const row = await prisma.config.findFirst({ where: { key: 'GHPublishConfig' } })
    const { owner = '', repo = '', token = '', path = 'posts' } = typeof row?.value === 'string' ? JSON.parse(row.value) : {}
    if (!owner || !repo || !token) {
      ctx.body = createRes(null, 500, '没有发布配置')
      return
    }
    // @todo
  })

export default router;