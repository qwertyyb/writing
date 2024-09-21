import type { IWritingAttribute } from "@writing/types"

export interface IAttribute {
  docId: number
  key: string,
  value: string,
}

export interface IConfig {
  key: string
  value: string
}

export interface IDocument {
  id: number,
  title: string,
  content: string,
  path: string,
  nextId: number | null,
  createdAt: string,
  updatedAt: string,
  attributes: IWritingAttribute[]
}

export interface IFile {
  name: string,
  mimetype: string,
  createdAt: string,
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
  findMany: () => Promise<ResponseData<{ total: number; list: Omit<IDocument, "content">[]; }>>
  find: (where: { id: number }) => Promise<ResponseData<IDocument>>
  update: (data: Pick<IDocument, "id"> & Partial<Pick<IDocument, "title" | "content">>) => Promise<ResponseData<unknown>>
  updateMany: (data: {
    id: number;
    path: string;
    nextId: number | null;
  }[]) => Promise<ResponseData<{ success: boolean }>>
  remove: (where: { id: number }) => Promise<ResponseData<unknown>>
  add: (data: Pick<IDocument, "title" | "content" | "path">) => Promise<ResponseData<Omit<IDocument, "content">>>
  findByShareId: (where: { id: string }) => Promise<ResponseData<{
    key: string;
    value: string;
    doc: IDocument;
  }>>
}

export interface IAttributeService {
  setAttributes: (docId: number, attributes: IWritingAttribute[]) => Promise<ResponseData<IAttribute[]>>
  removeAttributes: (docId: number, keys: string[]) => Promise<ResponseData<null>>
}

export interface IConfigService {
  setValue: (key: string, value: string | null) => Promise<ResponseData<{ value: string | null }>>
  getValue: (key: string) => Promise<string | undefined>
  getValues: (keys: string[]) => Promise<{ key: string, value: string }[]>
}

export interface IFileService {
  upload: (file: File | Blob, options?: Partial<{ name: string, mimetype: string }>) => Promise<ResponseData<{ url: string }>>
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

export interface IService {
  documentService: IDocumentService
  configService: IConfigService
  attributeService: IAttributeService
  fileService: IFileService
  authService: IAuthService
}