import KoaRouter from '@koa/router';
import { createRes } from '../utils';
import { orm } from '../typeorm/schema';

const router = new KoaRouter({ prefix: '/api/v1/public' });

router.get('/get', async (ctx) => {
  const { id } = ctx.request.query as { id: string };
  if (!id) {
    ctx.body = createRes(null, 400, '未传入id');
    return;
  }
  // 判断权限
  const record = await orm.attribute.findOne({
    where: { value: id, key: 'share' },
    relations: { doc: true },
  });
  if (!record) {
    ctx.body = createRes(null, 404, '未找到此id');
    return;
  }
  ctx.body = createRes(record);
});

export default router;
