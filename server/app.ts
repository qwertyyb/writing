import Koa from 'koa';
import { useRouter } from './routes';

const app = new Koa();

useRouter(app);

app.listen(4000, () => {
  console.log('server start on port:', 4000);
});
