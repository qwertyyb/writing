<template>
  <div class="settings-view">
    <div class="settings-side">
      <el-menu class="settings-menu" router
        :default-active="$route.path"
        :collapse="size === ScreenSize.Small">
        <el-menu-item index="/admin/settings/auth" v-if="supportAuth">
          <el-icon><Lock /></el-icon>
          <template #title>鉴权</template>
        </el-menu-item>
        <el-menu-item index="/admin/settings/file">
          <el-icon><Folder /></el-icon>
          <template #title>文件</template>
        </el-menu-item>
      </el-menu>
    </div>
    <div class="settings-main">
      <router-view></router-view>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { Folder, Lock } from '@element-plus/icons-vue';
import { useSize } from '@/hooks/useSize';
import { ScreenSize } from '@/utils/resize';
import { ref } from 'vue';
import { authService } from '@/services';
import router from '@/router';

const { size } = useSize();
const supportAuth = ref(authService.supportAuth())

if (supportAuth.value) {
  router.replace('/admin/settings/auth')
} else {
  router.replace('/admin/settings/file')
}
</script>

<style lang="less" scoped>
.settings-view {
  display: flex;
  padding: 0 20px 0 0;
  height: 100%;
  .settings-menu {
    height: 100%;
  }
  .settings-main {
    flex: 4;
    padding: 20px;
    width: 300px;
    margin: 0 auto;
  }
}
</style>