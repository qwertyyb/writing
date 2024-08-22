<script setup lang="ts">
import { init } from '@/services/fs';
import { RouterView } from 'vue-router'

const authFs = () => {
  init()
}
</script>

<template>
  <button @click="authFs">授权</button>
  <RouterView />
</template>

<style lang="less">
body {
  font-family: "LXGW WenKai";
}
html, body, #app {
  height: 100%;
}
</style>
