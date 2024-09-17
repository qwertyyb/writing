import { createServer } from 'node:http';
import Koa from 'koa';
import { koaBody } from 'koa-body';
import send from 'koa-send';
import koaLogger from 'koa-logger';
import { useRouter } from './routes/index.ts';
import { fallback } from './middlewares/404.ts';
import path from 'path';
import { PORT } from './const.ts';
import { createLogger } from './utils/logger.ts';
import { startWebhook } from './service/webhook.ts';
import { startGithubPublisher } from './service/GithubPublisher.ts';

const logger = createLogger('app');

const app = new Koa();

app.use(koaLogger());

app.use(fallback);

app.use(koaBody({
  multipart: true,
  formidable: {
    keepExtensions: true,
    hashAlgorithm: 'sha1',
  },
}));

useRouter(app);

// 静态文件
app.use(async (ctx) => {
  let sent = false;
  try {
    sent = !!(await send(ctx, ctx.path, { root: path.join(__dirname, '../frontend/dist') }));
  } catch (err) {
    if (err.status !== 404) {
      throw err;
    }
  }
  if (!sent) {
    await send(ctx, 'index.html', { root: path.join(__dirname, '../frontend/dist') });
  }
});

const httpServer = createServer(app.callback());

httpServer.listen(PORT, () => {
  logger.i('server start on port: ', PORT);
  startWebhook()
  startGithubPublisher()
});
