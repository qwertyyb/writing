import { PrismaClient } from '@prisma/client';
import { adapter } from './prisma/adapter';
import { createLogger } from './utils/logger';
import { dbPath } from './const';
import { dbhash } from './utils';

const logger = createLogger('prisma');

console.log('prisma dbPath', dbPath);

adapter.on('query', (event) => {
  if (!event.success) return;
  if (event.sql.includes('`SQLHistory`')) return;
  const isUpdate = ['insert ', 'update ', 'delete ', 'alter '].some(item => event.sql.toLowerCase().includes(item));
  if (!isUpdate) return;
  logger.i('query', event);
  logger.i('dbhash', dbhash());
  Promise.resolve().then(() => {
    logger.i('dbhash promise', dbhash());
  });
  setTimeout(() => {
    logger.i('dbhash after', dbhash());
  }, 400);
  // @todo buffer数据的存储需要再瞅瞅
  prisma.sQLHistory.create({ data: { sql: event.sql, params: JSON.stringify(event.args), checksum: dbhash() } })
    .then(res => {
      console.log(res);
    });
});

export const prisma = new PrismaClient({
  adapter,
});

const init = async () => {
  const hasRoot = await prisma.document.findFirst({ where: { path: '' }, select: { id: true } });
  if (hasRoot) return;
  await prisma.document.create({
    data: {
      id: 1,
      title: 'root',
      content: JSON.stringify({
        id: 'root',
        type: 'doc',
        data: { title: 'root' },
        children: [
          {
            type: 'text',
            id: 'rootext',
            data: {
              html: '这是根文档',
            },
          },
        ],
      }),
      path: '',
    },
  });
};

init();
