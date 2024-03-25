import { PrismaClient } from '@prisma/client';
import path from 'node:path';
import { SqliteAdapter } from './prisma/adapter';
import { createLogger } from './utils/logger';

const logger = createLogger('prisma');

const dbPath = path.join(__dirname, process.env.DATABASE_URL.replace(/^file:/, ''));

console.log('prisma dbPath', dbPath);

const adapter = new SqliteAdapter(dbPath);

adapter.on('query', (event) => {
  logger.i('query', event.sql, event.args, event.success);
});

export const prisma = new PrismaClient({
  adapter,
});

const init = async () => {
  const hasRoot = await prisma.document.findFirst({ where: { path: '' }, select: { id: true } });
  if (!hasRoot) {
    await prisma.document.create({
      data: {
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
  }
};

init();
