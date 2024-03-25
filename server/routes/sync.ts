import KoaRouter from '@koa/router';
import { needAuth } from '../middlewares/auth';

const router = new KoaRouter();

router.use(needAuth);

router.