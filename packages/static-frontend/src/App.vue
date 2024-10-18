<script setup lang="ts">
import { RouterView } from 'vue-router'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
</script>

<template>
  <el-config-provider :locale="zhCn">
    <RouterView />
  </el-config-provider>
</template>

<style>
body {
  font-family: "LXGW WenKai";
  margin: 0;
  padding: 0;
}
a, a:visited {
  color: blue;
  text-decoration: none;
}
</style>
