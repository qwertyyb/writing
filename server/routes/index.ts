import type Koa from 'koa';
import articleRouter from './article';

export const useRouter = (app: Koa) => {
  app.use(articleRouter.routes());
}
