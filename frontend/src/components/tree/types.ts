import type { Document } from "@/services/document";

export interface TreeNodeModel extends Omit<Document, 'content'> {
  children: TreeNodeModel[]
}
