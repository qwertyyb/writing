import type { ElMessage, ElMessageBox, ElNotification } from 'element-plus'
import { IAttributeOptions, INoteAction, IWritingNote } from './note'

export interface IWritingApp {
  fetch: typeof fetch,
  addNoteAction: (action: INoteAction) => void,
  getSettingsValue: () => any | undefined | null,
  currentNote: () => Promise<IWritingNote | null>,
  openSettings: () => void,

  setAttribute: (noteId: number, key: string, value: string, options?: IAttributeOptions) => Promise<void>,
  setAttributes: (noteId: number, attributes: {key: string, value: string, options: IAttributeOptions}[]) => Promise<void>
  removeAttributes: (noteId: number, keys: string[]) => Promise<void>,

  notification: typeof ElNotification,
  messageBox: typeof ElMessageBox
  message: typeof ElMessage
}

export interface IWritingPluginReturn {
  settings: any,
}

export interface IWritingPlugin {
  destroy?: () => void,
  settings: any, // 先支持json-schema, 后面再考虑是否要支持custom render
}

export interface IWritingPluginConstructor {
  new (app: IWritingApp): IWritingPlugin
}