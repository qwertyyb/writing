import type Koa from 'koa';
import postRouter from './post';
import uploadRouter from './upload';
import publicRouter from './public';
import attributeRouter from './attributes';
import authRouter from './auth';
import configRouter from './config';

export const useRouter = (app: Koa) => {
  app.use(authRouter.routes());
  app.use(postRouter.routes());
  app.use(uploadRouter.routes());
  app.use(publicRouter.routes());
  app.use(attributeRouter.routes());
  app.use(configRouter.routes());
};