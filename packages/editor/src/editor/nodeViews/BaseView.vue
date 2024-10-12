<script lang="ts" setup>
import type { VueNodeViewProps } from '@/editor/plugins/vueNodeViews';
import type { NodeView } from 'prosemirror-view';
import { ref } from 'vue';

defineProps<VueNodeViewProps>()

const contentDOM = ref<HTMLElement>()

defineExpose<{
  getContentDOM?: () => HTMLElement,
  selectNode: NodeView["selectNode"],
  deselectNode: NodeView["deselectNode"],
  setSelection: NodeView["setSelection"],
  update: NodeView["update"],
  stopEvent: NodeView["stopEvent"]
}>()
</script>