<template>
  <div class="settings-view">
    <div class="settings-sider">
      <dl class="settings-list">
        <dt class="settings-section-header">基础</dt>
        <dd class="settings-item"
          :class="{selected: activeTab === 'server'}"
          @click="activeTab = 'server'"
        >服务</dd>
        <dd class="settings-item"
          :class="{selected: activeTab === 'auth'}"
          @click="activeTab = 'auth'"
        >鉴权</dd>
        <dd class="settings-item"
          :class="{selected: activeTab === 'file'}"
          @click="activeTab = 'file'"
        >文件</dd>
        <dd class="settings-item"
          :class="{selected: activeTab === 'export'}"
          @click="activeTab = 'export'"
        >导出</dd>
        <dt class="settings-section-header">插件</dt>
        <dd class="settings-item"
          v-for="plugin in pluginsRuntime"
          :key="plugin.meta.name"
          :class="{selected: activeTab === `Plugin.${plugin.meta.name}`}"
          @click="activeTab = `Plugin.${plugin.meta.name}`"
        >{{ plugin.meta.title }}</dd>
      </dl>
    </div>
    <section class="settings-item-view">
      <server-settings-view v-if="activeTab === 'server'" :redirect="false"></server-settings-view>
      <auth-settings-view v-else-if="activeTab === 'auth'"></auth-settings-view>
      <file-settings-view v-else-if="activeTab === 'file'"></file-settings-view>
      <export-data-view v-else-if="activeTab === 'export'"></export-data-view>
      <plugins-settings-view v-else-if="activeTab.startsWith('Plugin.')" :name="activeTab.replace(/^Plugin\./, '')"></plugins-settings-view>
    </section>
  </div>
</template>

<script lang="ts" setup>
import { service } from '@/services';
import AuthSettingsView from '@/views/AuthSettingsView.vue';
import FileSettingsView from '@/views/FileSettingsView.vue';
import PluginsSettingsView from '@/views/PluginsSettingsView.vue';
import ExportDataView from '@/views/ExportDataView.vue';
import ServerSettingsView from '@/views/ServerSettingsView.vue';
import { ref } from 'vue';
import { pluginsRuntime } from '@/plugin';

const props = defineProps<{ defaultTab: string }>()

const supportAuth = service.authService.supportAuth()
const activeTab = ref(props.defaultTab || (supportAuth ? 'auth' : 'file'))

</script>

<style lang="less" scoped>
.settings-view {
  padding: 0 20px 0 0;
  height: 60vh;
  display: flex;
  .settings-sider {
    width: 180px;
    flex-shrink: 0;
    flex-grow: 0;
    border-right: 1px solid #ccc;
    .settings-list {
      margin: 0;
    }
    .settings-section-header {
      font-size: 17px;
      font-weight: bold;
      color: rgba(0, 0, 0, 0.5);
      margin-top: 2em;
      &:first-child {
        margin-top: 0;
      }
    }
    .settings-item {
      margin: 4px 0;
      height: 28px;
      line-height: 28px;
      cursor: pointer;
      padding-left: 1.5em;
      color: #000;
      border-radius: 2px;
      transition: background .2s, color .1s;
      &:hover {
        background: var(--theme-hover-color);
      }
      &.selected {
        background: var(--theme-main-color);
        color: #fff;
      }
    }
  }
  .settings-item-view {
    margin: 0 0 0 1em;
    flex: 1;
    height: 100%;
    overflow: auto;
  }
}
</style>