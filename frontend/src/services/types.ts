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

export interface IAuthService extends Record<string, Function> {
  supportAuth: () => boolean
}

export interface ResponseData<D extends any = any> {
  errCode: number,
  errMsg: string,
  data: D
}

export interface IDocumentService {
  findMany: () => Promise<ResponseData<{ total: number; list: Omit<Document, "content">[]; }>>
  find: (where: { id: number }) => Promise<ResponseData<Document>>
  update: (data: Pick<Partial<Document>, "id" | "title" | "content">) => Promise<ResponseData<unknown>>
  updateMany: (data: {
    id: number;
    path: string;
    nextId: number | null;
  }[]) => Promise<ResponseData<{ success: boolean }>>
  remove: (where: { id: number }) => Promise<ResponseData<unknown>>
  add: (data: Pick<Document, "title" | "content" | "path">) => Promise<ResponseData<Omit<Document, "content">>>
  findByShareId: (where: { id: string }) => Promise<ResponseData<{
    key: string;
    value: string;
    doc: Document;
  }>>
}

export interface IAttributeService {
  setAttributes: (docId: number, attributes: Omit<Attribute, "docId">[]) => Promise<ResponseData<Attribute[]>>
}

export interface IConfigService {
  setValue: (key: string, value: string | null) => Promise<ResponseData<{ value: string | null }>>
  getValue: (key: string) => Promise<string | undefined>
  getValues: (keys: string[]) => Promise<{ key: string, value: string }[]>
}

export interface IFileService {
  upload: (file: File | Blob) => Promise<ResponseData<{ url: string }>>
  check: (query?: Partial<{
    start: Date;
    end: Date;
    mimetype: string;
  }>) => Promise<ResponseData<{
    name: string;
    mimetype: string;
    createdAt: string;
    url: string;
    documents: {
        id: number;
        title: string;
    }[];
  }[]>>
  remove: (names: string[]) => Promise<ResponseData<{ count: number }>>
}