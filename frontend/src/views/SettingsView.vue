<template>
  <component :is="size === ScreenSize.Large ? 'ElDialog' : 'div'" :model-value="true" @close="closedHandler">
    <div class="settings-view">
      <div class="settings-side">
        <el-menu class="settings-menu" router
          :default-active="$route.path"
          :collapse="size === ScreenSize.Small">
          <el-menu-item index="/admin/settings/server">
            <el-icon><Lock /></el-icon>
            <template #title>服务</template>
          </el-menu-item>
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
  </component>
</template>

<script lang="ts">
import { Folder, Lock } from '@element-plus/icons-vue';
import { useSize } from '@/hooks/useSize';
import { ScreenSize } from '@/utils/resize';
import { defineComponent } from 'vue';
import { ElMenu, ElMenuItem, ElIcon, ElDialog } from 'element-plus';
import { service } from '@/services';
import router from '@/router';

const { size } = useSize();

export default defineComponent({
  components: {
    Folder, Lock,
    ElMenu, ElMenuItem, ElIcon, ElDialog
  },
  beforeRouteEnter(to, from, next) {
    next(vm => {
      // @ts-ignore
      vm.setFrom(from.fullPath)
    })
  },
  data() {
    return {
      size,
      ScreenSize,
      supportAuth: service.authService.supportAuth(),
      from: ''
    }
  },
  methods: {
    closedHandler() {
      router.push(this.from)
    },
    setFrom(from: string) {
      this.from = from
    }
  }
})
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