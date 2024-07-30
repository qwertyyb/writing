import type { Node } from "prosemirror-model";
import { toDOMRender } from "../plugins/vueNodeViews";
import ImageView from "../node-views/ImageView.vue";

export const createImageNode = (node: Node) => {
  return toDOMRender(node, ImageView)
}