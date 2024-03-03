<template>
  <div class="test-immer-view">
    {{ state.a }}
    <button @click="inc">+1</button>
    <test-immer-view-child :value="state.b"></test-immer-view-child>
  </div>
</template>

<script lang="ts" setup>
import { shallowRef } from 'vue'
import { produce } from 'immer'
import TestImmerViewChild from './TestImmerViewChild.vue';

const state = shallowRef({
  a: 1,
  b: {
    a: 1
  }
})

const inc = () => {
  state.value = produce(state.value, draft => {
    draft.a += 1
    draft.b.a += 1
  })
}

</script>