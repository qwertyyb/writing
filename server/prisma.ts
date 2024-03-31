import { PrismaClient } from '@prisma/client';
import { adapter } from './prisma/adapter';

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
