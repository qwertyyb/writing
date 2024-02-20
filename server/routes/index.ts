import type Koa from 'koa';
import articleRouter from './document';
import uploadRouter from './upload';
import publicRouter from './public';
import attributeRouter from './attributes';

export const useRouter = (app: Koa) => {
  app.use(articleRouter.routes());
  app.use(uploadRouter.routes());
  app.use(publicRouter.routes());
  app.use(attributeRouter.routes());
}
