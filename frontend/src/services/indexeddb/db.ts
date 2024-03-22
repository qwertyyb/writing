import Dexie, { type Table } from 'dexie'
import type { Attribute, Config, Document } from '../types'

export interface BlobFile {
  name: string
  content: Blob
  mimetype: string
  createdAt: string
}

export class WritingDexie extends Dexie {
  config!: Table<Config, number>
  document!: Table<Document, number>
  attribute!: Table<Attribute, number>
  file!: Table<BlobFile, string>

  constructor() {
    super('writing')
    this.version(4).stores({
      config: '++id, key', // Primary key and indexed props
      document: '++id, path, nextId',
      attribute: '++id, docId, key',
      file: '&name, mimetype'
    });
  }
}

export const db = new WritingDexie()