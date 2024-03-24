import KoaRouter from '@koa/router';
import { needAuth } from '../middlewares/auth';
import { createRes } from '../utils';
import { orm } from '../typeorm/schema';
import { In } from 'typeorm';

const router = new KoaRouter({ prefix: '/api/v1/attribute' });

router.use(needAuth);

router
  .patch('/update', async (ctx) => {
    const { docId, attributes } = ctx.request.body as ({ docId: number, attributes: { key: string, value: string }[] });
    if (!docId || attributes.some((attr) => !attr.key)) {
      ctx.body = createRes(null, 400, '未传入id或key');
      return;
    }
    await Promise.all(attributes.map((attr) => {
      return orm.attribute.upsert(
        { docId, key: attr.key, value: attr.value },
        ['docId', 'key']
      );
    }));
    const results = await orm.attribute.find({
      where: {
        docId: docId,
        key: In(attributes.map(item => item.key))
      }
    });
    ctx.body = createRes(results);
  });

export default router;
