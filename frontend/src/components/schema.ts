import type { BlockModel } from "@/models/block"

export enum Mode {
  Edit = 'Edit',
  Readonly = 'Readonly',
}

export enum ImageAlign {
  Left = 'Left',
  Center = 'Center',
  Right = 'Right'
}

export interface ImageData {
  src: string
  align: ImageAlign
  size: number, // 宽度
  ratio: number, // 长宽比例
  title: BlockModel,
}