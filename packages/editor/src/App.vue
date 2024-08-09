<script setup lang="ts">
import { shallowRef } from 'vue';
import DocumentEditor from './editor/DocumentEditor.vue'
import { demo } from './doc'
import { type NodeValue } from './editor/types'

const value = shallowRef<NodeValue>(demo)
</script>

<template>

  <main>
    <DocumentEditor v-model="value"></DocumentEditor>
  </main>
</template>

<style scoped>
</style>
