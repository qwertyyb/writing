import type { IDocument } from "@/services/types";

export interface TreeNodeModel extends Omit<IDocument, 'content' | 'attributes'> {
  children: TreeNodeModel[]
}
