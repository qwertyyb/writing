import TextRenderer from "./TextBLock.vue";

export interface TextData {
  html: string
}

export default {
  identifier: 'text',
  label: '文本',

  component: TextRenderer,
}