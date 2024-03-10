import { inject, type ComputedRef } from 'vue';

export const useSpellcheck = () => {
  const spellcheck = inject<ComputedRef<boolean>>('spellcheck')!;

  return spellcheck;
};