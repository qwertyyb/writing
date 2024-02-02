import { type Ref, inject } from "vue"

export const useSpellcheck = () => {
  const spellcheck = inject<Ref<boolean>>('spellcheck')

  return spellcheck
}