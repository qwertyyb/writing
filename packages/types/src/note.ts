export interface IAttributeOptions {
  label?: string,
  formatValue?: 'raw' | 'date' | 'link'
}

export interface IWritingAttribute {
  key: string,
  value: string,
  options?: IAttributeOptions
}

export interface IWritingNote {
  id: number
  title: string

  createdAt: string
  updatedAt: string

  attributes: IWritingAttribute[]

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
