import { PrismaClient } from '@prisma/client';
import path from 'node:path';

const dbPath = path.join(__dirname, process.env.DATABASE_URL.replace(/^file:/, ''));

console.log('prisma dbPath', dbPath);

export const prisma = new PrismaClient({
  log: [
    { level: 'query', emit: 'event' },
  ],
});

prisma.$on('query', (event) => {
  console.log('query', event);
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
