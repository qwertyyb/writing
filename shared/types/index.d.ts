interface Post {
  id: number
  title: string

  createdAt: string
  updatedAt: string

  deleted: boolean
  deletedAt: string

  attributes: Record<string, any>
}

interface PostAttachment {
  name: string
  mimetype: string
  createdAt: string
}

interface ConfigData {
  name: string
  value: string | number | null | object | Array<any>
}
