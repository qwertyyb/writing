import Delta from 'quill-delta';
import Op from 'quill-delta/dist/Op';

export const join = (left: Op[], right: Op[]) => {
  const newOps: Op[] = [];
  let replaced = false;
  for(let i = left.length - 1; i >= 0; i-= 1) {
    const item = { ...left[i] };
    if (typeof item.insert === 'string' && !replaced) {
      item.insert = item.insert.replace(/\n$/, '');
      replaced = true;
    }
    newOps.unshift(item);
  }
  const originDelta = new Delta(newOps);
  const after = new Delta([
    { retain: originDelta.length() },
    ...right
  ]);
  return {
    ops: originDelta.compose(after).ops,
    originLength: originDelta.length()
  };
};

export const split = (ops: Op[], index: number) => {
  const delta = new Delta(ops);
  const before = delta.slice(0, index);
  const after = delta.slice(index);

  return { before: before.ops, after: after.ops };
};

export const toText = (ops: Op[]) => {
  return ops.reduce<string>((acc, cur) => {
    return acc + ((typeof cur.insert === 'string') ? cur.insert : ' ');
  }, '');
};

export const isEmpty = (ops: Op[]) => {
  const text = toText(ops);
  return text === '' || text === '\n';
};

export const setAttributes = (ops: Op[], range: { index: number, length: number }, attrs: Record<string, any> = {}): Op[] => {
  return new Delta(ops).compose(new Delta().retain(range.index).retain(range.length, attrs)).ops;
};

export const getOps = (ops: Op[], range: { index: number, length: number }): Op[] => {
  const results: Op[] = [];
  new Delta(ops).slice(range.index, range.index + range.length).eachLine(line => {
    results.push(...line.ops);
  });
  return results;
};
