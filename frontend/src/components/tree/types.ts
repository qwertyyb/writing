import type { IDocument } from "@/services/types";

export interface TreeNodeModel extends Omit<IDocument, 'content'> {
  children: TreeNodeModel[]
}
