import KoaRouter from '@koa/router';
import { createRes } from '../utils';
import { needAuth } from '../middlewares/auth';
import { Document, orm } from '../typeorm/schema';
import { Like } from 'typeorm';

const router = new KoaRouter({ prefix: '/api/v1/document' });

router.use(needAuth);

router
  .get('/list', async (ctx) => {
    const { where = {} } = ctx.query;
    const [total, list] = await Promise.all([
      orm.document.count({ where }),
      orm.document.find({
        where: { deleted: false, ...where },
        select: {
          id: true, path: true, title: true, updatedAt: true, createdAt: true, deleted: true, deletedAt: true, nextId: true
        },
        relations: ['attributes']
      }),
    ]);
    ctx.body = createRes({ total, list });
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
    const document = await orm.document.findOne({
      where: { id },
      relations: { attributes: true },
    });
    ctx.body = createRes(document);
  })
  .patch('/update', async (ctx) => {
    const id = Number(ctx.request.body.id);
    const { title, content } = ctx.request.body;
    if (!id) {
      ctx.body = createRes(null, 400, '未传入参数id');
      return;
    }
    if (!title && !content) {
      ctx.body = createRes(null, 400, 'path、title、content不能全为空');
      return;
    }
    const data = await orm.document.update({ id }, {
      title, content,
    });
    ctx.body = createRes(data);
  })
  .patch('/move', async (ctx) => {
    const updates = ctx.request.body as { id: number, path: string, nextId: number | null }[];
    if (!updates || !updates.length) {
      ctx.body = createRes(null, 400, '未传入参数');
      return;
    }
    const resetList = updates.map((item) => ({ ...item, nextId: null }));
    const result = await orm.$transaction(async (manager) => {
      await Promise.all([...resetList, ...updates]
        .map((item) => manager
          .update(Document, { id: item.id }, { path: item.path, nextId: item.nextId })
        ));
    });
    ctx.body = createRes(result);
  })
  .del('/remove', async (ctx) => {
    const id = Number(ctx.query.id);
    if (!id) {
      ctx.body = createRes(null, 400, '未传入id');
      return;
    }
    // 删除需要把子文档也删除
    const node = await orm.document.findOne({ where: { id } });
    const path = `${node.path}/${node.id}`;

    const result = await orm.$transaction(async (manager) => {
      await manager.update(
        Document,
        [
          { path: Like(`${path}%`) },
          { id }
        ],
        { deleted: true, deletedAt: new Date(), nextId: null }
      );
      await manager.update(
        Document,
        { nextId: id },
        { nextId: node.nextId }
      );
    });
    ctx.body = createRes(result);
  })
  .post('/add', async (ctx) => {
    const { title, content, path } = await ctx.request.body;
    const record = await orm.document.insert({
      title, content, path,
    });
    ctx.body = createRes(record);
  });

export default router;
