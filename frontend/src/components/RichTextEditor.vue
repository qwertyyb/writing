<template>
  <div class="rich-text-editor" ref="el">
    <block-editor v-model="model" :index="0" :path="[0]" :key="model.id"></block-editor>
  </div>
</template>

<script lang="ts" setup>
import { createBlock, type BlockModel } from '@/models/block';
import BlockEditor from './BlockEditor.vue';
import { useFocusEvent } from '@/hooks/focus';
import { provide, type PropType, computed } from 'vue';
import { Mode } from './schema';

const model = defineModel<ReturnType<typeof createBlock>>({
  required: true
})
const props = defineProps({
  mode: {
    type: String as PropType<Mode>,
    default: Mode.Edit
  },
  spellcheck: {
    type: Boolean,
    default: false
  }
})

const mode = computed(() => props.mode)
const spellcheck = computed(() => props.spellcheck)

provide('mode', mode)
provide('spellcheck', spellcheck)
provide('root', model)
provide('blockInstances', new Map())

const emits = defineEmits<{
  change: [BlockModel],
  'update:modelValue': [BlockModel]
}>()

useFocusEvent()

</script>

<style scoped>
.rich-text-editor {
  min-width: 50vw;
  min-height: 50vh;
  position: relative;
}
</style>