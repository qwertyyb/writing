<script lang="ts" setup>
import type { VueNodeViewProps } from '@/editor/plugins/vueNodeViews';
import { ref } from 'vue';

defineProps<VueNodeViewProps>()

const contentDOM = ref<HTMLElement>()

defineExpose({
  getContentDOM() {
    return contentDOM.value
  },
  selectNode() {

  },
  deselectNode() {
    
  }
})
</script>