import TextBlock from "./TextBlock.vue";

export interface TextData {
  html: string
}

export default {
  identifier: 'text',
  label: '文本',

  component: TextBlock,
}