import Koa from 'koa';
import { koaBody } from 'koa-body';
import { useRouter } from './routes';
import { createRes } from './utils';
import { fallback } from './middlewares/404';

const app = new Koa();

app.use(fallback)

app.use(koaBody({
  multipart: true,
  formidable: {
    keepExtensions: true,
    hashAlgorithm: 'sha1'
  }
}))

useRouter(app);

app.listen(4080, () => {
  console.log('server start on port:', 4080);
});
