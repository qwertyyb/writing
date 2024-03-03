import type { DeltaOperation } from "quill";
import TextBlock from "./TextBlock.vue";

export interface TextData {
  ops: DeltaOperation[]
}

export default {
  identifier: 'text',
  label: '文本',

  component: TextBlock,
}