<template>
  <div class="settings-view">
    <el-tabs v-model="activeTab" tab-position="left" stretch style="height: 100%">
      <el-tab-pane name="auth" label="鉴权" v-if="supportAuth">
        <auth-settings-view></auth-settings-view>
      </el-tab-pane>
      <el-tab-pane name="file" label="文件">
        <file-settings-view></file-settings-view>
      </el-tab-pane>
      <el-tab-pane name="plugin" label="插件">
        <plugins-settings-view></plugins-settings-view>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script lang="ts" setup>
import { ElTabs, ElTabPane } from 'element-plus';
import { service } from '@/services';
import AuthSettingsView from '@/views/AuthSettingsView.vue';
import FileSettingsView from '@/views/FileSettingsView.vue';
import PluginsSettingsView from '@/views/PluginsSettingsView.vue';
import { ref } from 'vue';

const supportAuth = service.authService.supportAuth()
const activeTab = ref(supportAuth ? 'auth' : 'file')

</script>

<style lang="less" scoped>
.settings-view {
  padding: 0 20px 0 0;
  height: 60vh;
}
</style>