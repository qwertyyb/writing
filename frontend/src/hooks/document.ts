import { createBlock, type BlockModel } from "@/models/block";
import { updateDocument } from "@/services/document";
import { applyPatch, type AddJSONPatch, type RemoveJSONPatch } from "@/utils/patch";

type KeyPath = (string | number)[]

export const useDocument = (options: {
  root: BlockModel,
  updateDocument: (newValue: BlockModel) => void
}) => {
  const { root } = options

  const addBlock = (path: KeyPath, options: Partial<BlockModel>) => {
    const patch: AddJSONPatch = { op: 'add', path, value: createBlock(options) }
    updateDocument(applyPatch(root, [patch]))
  }

  const removeBlock = (path: KeyPath) => {
    updateDocument(applyPatch(root, [
      { op: 'remove', path } as RemoveJSONPatch
    ]))
  }

  const updateBlock = (path: KeyPath, value: Partial<BlockModel>) => {
    
  }
}