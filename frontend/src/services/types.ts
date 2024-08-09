export interface Attribute {
  docId: number
  key: string,
  value: string,
}

export interface Config {
  key: string
  value: string
}

export interface Document {
  id: number,
  title: string,
  content: string,
  path: string,
  nextId: number | null,
  createdAt: string,
  updatedAt: string,
  attributes: Attribute[]
}

class ServiceError extends Error {
  constructor(public errCode: number, public errMsg: string, message?: string, options?: ErrorOptions) {
    super(message, options)
  }
}

export class AuthError extends ServiceError {}