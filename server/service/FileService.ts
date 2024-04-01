import { prisma } from '../prisma';

export class FileService {
  check = async (query: Partial<{ start: Date, end: Date, mimetype: string }>) => {
    console.log('check', query, (query.start || query.end) ? { createdAt: {
      lte: query.end ? query.end : undefined,
      gte: query.start ? query.start : undefined
    } } : {});
    const [files, documents] = await Promise.all([
      prisma.file.findMany({
        where: {
          mimetype: query.mimetype ? query.mimetype : undefined,
          ...((query.start || query.end) ? { createdAt: {
            gte: query.start ? query.start.toISOString() : undefined
          } } : {})
        },
        select: { name: true, mimetype: true, createdAt: true },
      }),
      prisma.document.findMany({
        where: { deleted: false },
        select: { id: true, title: true, content: true }
      })
    ]);
    return files.map(file => {
      const reg = new RegExp(`/api/v1/file\\?name=${file.name}`);
      const results = documents.filter(document => reg.exec(document.content)).map(item => ({ id: item.id, title: item.title }));
      return { ...file, documents: results };
    });
  };
}

export const fileService = new FileService();
