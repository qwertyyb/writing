import { heading1, heading2, heading3, heading4, heading5, heading6 } from "../blocks/heading";
import TextBlock from "../blocks/TextBlock";
import ListBlocks from '../blocks/list/ListBlock';
import ImageBlock from '../blocks/image/ImageBlock';
import linkBlock from "../blocks/link/LinkBlock";
import blockQuote from "../blocks/block-quote/block-quote";
import divider from "../blocks/divider/divider";
import codeBlock from "../blocks/code-block/codeBlock";

const commands = [
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
  codeBlock
]

export default commands