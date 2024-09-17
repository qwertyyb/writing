import { PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient()

export const getPostWithAttrs = async (id: number) => {
  const post = await prisma.document.findFirst({ where: { id }, include: { attributes: true } })
  return {
    ...post,
    createdAt: post!.createdAt.toISOString(),
    updatedAt: post!.updatedAt.toISOString(),
    deletedAt: post!.deletedAt?.toISOString() ?? null,
  }
}

const init = async () => {
  const hasRoot = await prisma.document.findFirst({ where: { path: '' }, select: { id: true } })
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
                html: '这是根文档'
              }
            }
          ]
        }),
        path: ''
      }
    })
  }
}

init()