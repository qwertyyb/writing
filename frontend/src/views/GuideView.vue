<template>
  <div class="guide-view">
    <h1>内容存储设置</h1>
    <server-settings-view></server-settings-view>
  </div>
</template>

<script lang="ts" setup>
import ServerSettingsView from './ServerSettingsView.vue'
</script>

<style lang="less" scoped>
.guide-view {
  max-width: 600px;
  margin: 0 auto;
}
</style>