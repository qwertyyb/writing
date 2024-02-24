import { heading1, heading2, heading3, heading4, heading5, heading6 } from "./heading";
import TextBlock from "./TextBlock";
import ListBlocks from './list/list';
import ImageBlock from './image/ImageBlock';
import linkBlock from "./link/LinkBlock";
import blockQuote from "./block-quote/block-quote";
import divider from "./divider/divider";
import codeBlock from "./code/code";
import type { BlockModel } from "@/models/block";
import type { Component } from "vue";
import documentBlock from "./document/document";
import todo from "./todo/todo";

interface BlockConfig {
  identifier: string,
  label: string,
  renderChildren?: boolean,

  component: Component,
}

const commands: BlockConfig[] = [
  TextBlock,
  heading1,
  heading2,
  heading3,
  heading4,
  heading5,
  heading6,
  linkBlock,
  ...ListBlocks,
  ImageBlock,
  blockQuote,
  divider,
  codeBlock,
  documentBlock,
  todo,
]

export default commands

export const getBlockConfig = (block: BlockModel) => {
  const config = commands.find(command => command.identifier === block.type)
  return config
}