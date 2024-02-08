import Koa from 'koa';
import { koaBody } from 'koa-body';
import { useRouter } from './routes';

const app = new Koa();

app.use(koaBody({
  multipart: true,
  formidable: {
    keepExtensions: true,
    hashAlgorithm: 'sha1'
  }
}))

useRouter(app);

app.listen(4000, () => {
  console.log('server start on port:', 4000);
});
