import type Koa from 'koa';
import postRouter from './post.ts';
import uploadRouter from './upload.ts';
import publicRouter from './public.ts';
import attributeRouter from './attributes.ts';
import authRouter from './auth.ts';
import configRouter from './config.ts';
import pluginRouter from './plugin.ts';

export const useRouter = (app: Koa) => {
  app.use(authRouter.routes());
  app.use(postRouter.routes());
  app.use(uploadRouter.routes());
  app.use(publicRouter.routes());
  app.use(attributeRouter.routes());
  app.use(configRouter.routes());
  app.use(pluginRouter.routes());
};