<script setup lang="ts">
import { addPlugin } from '@/plugin';
import { RouterView } from 'vue-router'
import GithubPublisher from '../../packages/github-publisher';

addPlugin({ name: 'github-publisher', title: 'Github Publisher' }, GithubPublisher)
</script>

<template>
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
