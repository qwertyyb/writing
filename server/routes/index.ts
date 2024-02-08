import type Koa from 'koa';
import articleRouter from './document';
import uploadRouter from './upload';

export const useRouter = (app: Koa) => {
  app.use(articleRouter.routes());
  app.use(uploadRouter.routes());
}
