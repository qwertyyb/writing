<script setup lang="ts">
import { RouterView } from 'vue-router'
</script>

<template>
  <RouterView />
</template>

<style>
html, body, #app {
  height: 100%;
}
/* This changes all the animations globally */
:root {
  --animate-duration: 400ms;
  --animate-delay: 0;
}
</style>
