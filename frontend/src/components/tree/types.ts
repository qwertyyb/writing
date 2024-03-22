import type { Document } from "@/services/types";

export interface TreeNodeModel extends Omit<Document, 'content'> {
  children: TreeNodeModel[]
}
