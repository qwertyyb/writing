import { PrismaClient } from '@prisma/client';
import { adapter } from './prisma/adapter';
import { createLogger } from './utils/logger';
import { dbPath } from './const';
import { localService } from './service/sync';

const logger = createLogger('prisma');

console.log('prisma dbPath', dbPath);

adapter.on('query', async (event) => {
  if (!event.success) return;
  if (event.sql.includes('`SQLHistory`')) return;
  const isUpdate = ['insert ', 'update ', 'delete ', 'alter '].some(item => event.sql.toLowerCase().includes(item));
  if (!isUpdate) return;

  logger.i('query', event);
  return localService.query({ sql: event.sql, args: event.args });
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
