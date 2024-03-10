import { heading1, heading2, heading3, heading4, heading5, heading6 } from "./heading";
import TextBlock from "./TextBlock";
import ListBlocks from './list/list';
import link from "./link/link"
import blockQuote from "./block-quote/block-quote";
import divider from "./divider/divider";
import codeBlock from "./code/code";
import type { BlockModel } from "../../models/block";
import type { Component } from "vue";
import documentBlock from "./document/document";
import todo from "./todo/todo";
import { excalidraw } from "./excalidraw/excalidraw";
import { image } from "./image/image";
import { details } from "./details/details";
import { toc } from "./toc/toc";

interface BlockConfig {
  identifier: string,
  label: string,
  icon?: string,

  // 是否在选择器中显示，默认为显示
  visibleInSelector?: boolean,

  // 是否接管children的渲染
  renderChildren?: boolean,

  component: Component,
}

const commands: BlockConfig[] = [
  TextBlock,
  heading1,
  heading2,
  heading3,
  details,
  link,
  ...ListBlocks,
  image,
  blockQuote,
  divider,
  codeBlock,
  documentBlock,
  todo,
  excalidraw,
  heading4,
  heading5,
  heading6,
  toc
]

export default commands

export const getBlockConfig = (block: BlockModel) => {
  const config = commands.find(command => command.identifier === block.type)
  return config
}