import type { EditingDocument } from "@/stores/document";

const createBlockId = (): string => Math.random().toString(16).substring(2)

export const createEditingDocument = (parentPath: string): Pick<EditingDocument, 'title' | 'path' | 'content'> & Partial<EditingDocument> => {
  return {
    title: '新文档',
    path: parentPath,
    nextId: null,
    attributes: [],
    content: {
      id: createBlockId(),
      type: 'doc',
      data: {
        title: '新文档',
      },
      children: [
        {
          id: createBlockId(),
          type: 'text',
          data: {
            ops: [],
          },
          children: []
        }
      ]
    }
  }
}
