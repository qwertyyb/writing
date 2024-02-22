import { heading1, heading2, heading3, heading4, heading5, heading6 } from "../blocks/heading";
import TextBlock from "../blocks/TextBlock";
import ListBlocks from '../blocks/list/ListBlock';
import ImageBlock from '../blocks/image/ImageBlock';
import linkBlock from "../blocks/link/LinkBlock";
import blockQuote from "../blocks/block-quote/block-quote";
import divider from "../blocks/divider/divider";
import codeBlock from "../blocks/code-block/codeBlock";
import type { BlockModel } from "@/models/block";
import type { Component } from "vue";
import docBlock from "../blocks/doc-block/doc-block";
import todo from "../blocks/todo/todo";

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
  docBlock,
  todo,
]

export default commands

export const getBlockConfig = (block: BlockModel) => {
  const config = commands.find(command => command.identifier === block.type)
  return config
}