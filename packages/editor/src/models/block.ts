export interface BlockModel<D = any> {
  type: string;
  id: string;
  children: BlockModel[];
  data?: D;
}

export const createBlockId = (): string => Math.random().toString(16).substring(2);

export const createBlock = (options: Partial<BlockModel>): BlockModel => {
  if (!options.id) {
    options.id = createBlockId();
  }
  if (!options.type) {
    options.type = 'text';
    options.data = { ops: [] };
  }
  const block = {
    ...options,
    type: options.type ?? 'text',
    id: options.id ?? createBlockId(),
    children: options.children ?? []
  };
  return block;
};

export const isBlockModel = (value: any) => {
  return typeof value.type === 'string' && typeof value.id === 'string';
};
