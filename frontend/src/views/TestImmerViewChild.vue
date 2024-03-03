<template>
  <div class="test-immer-view">
    {{ value?.a ?? 'none' }}
  </div>
</template>

<script lang="ts" setup>
import { shallowRef } from 'vue'
import { produce } from 'immer'

const state = defineProps({
  value: Object
})

// const inc = () => {
//   state.value = produce(state.value, draft => {
//     draft.a += 1
//     draft.b.a += 1
//   })
// }

</script>