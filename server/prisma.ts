import { PrismaClient } from '@prisma/client';
import { SqliteAdapter } from './prisma/adapter';
import { createLogger } from './utils/logger';
import { dbPath } from './const';

const logger = createLogger('prisma');


console.log('prisma dbPath', dbPath);

const adapter = new SqliteAdapter(dbPath);

adapter.on('query', (event) => {
  if (!event.success) return;
  if (event.sql.includes('`SQLHistory`')) return;
  logger.i('query', event);
  // @todo buffer数据的存储需要再瞅瞅
  prisma.sQLHistory.create({ data: { sql: event.sql, params: JSON.stringify(event.args) } })
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
