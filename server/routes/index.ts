import type Koa from 'koa';
import articleRouter from './document';
import uploadRouter from './upload';
import publicRouter from './public';
import attributeRouter from './attributes';
import authRouter from './auth';
import configRouter from './config';
import syncRouter from './sync';

export const useRouter = (app: Koa) => {
  app.use(authRouter.routes());
  app.use(articleRouter.routes());
  app.use(uploadRouter.routes());
  app.use(publicRouter.routes());
  app.use(attributeRouter.routes());
  app.use(configRouter.routes());
  app.use(syncRouter.routes());
};
