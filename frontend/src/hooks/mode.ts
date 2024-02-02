import { Mode } from "@/components/schema"
import { computed, inject, type Ref } from "vue"

export const useMode = () => {
  const mode = inject<Ref<Mode>>('mode')

  const canEdit = computed(() => mode?.value === Mode.Edit)
  const readonly = computed(() => mode?.value === Mode.Readonly)

  return { canEdit, readonly }
}