export interface IAttributeOptions {

}

export interface IWritingNote {
  id: number
  title: string

  createdAt: string
  updatedAt: string

  attributes: { key: string, value: string, options?: IAttributeOptions }[]

  content: string
}

export type TNoteActionCallback = (params: { current: IWritingNote }) => void

export interface INoteAction {
  id: string
  title: string
  action?: TNoteActionCallback,
  icon?: string
  shortcut?: string
}
