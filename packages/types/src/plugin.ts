import { ElNotification } from 'element-plus'
import { INoteAction, IWritingNote } from './article'

export interface IWritingApp {
  addNoteAction: (action: INoteAction) => void,
  getSettingsValue: () => any,
  currentNote: () => IWritingNote | null,
  notification: typeof ElNotification
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