import { PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient()

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