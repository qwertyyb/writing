<template>
  <div class="server-settings-view">
    <el-form v-model="form" @submit.prevent>
      <el-form-item label="服务类型" v-model="form.server">
        <el-select v-model="form.server">
          <el-option value="writingServer" label="Writing服务"></el-option>
          <el-option value="indexedDB" label="IndexedDB"></el-option>
          <el-option value="fileSystem" label="文件系统"></el-option>
        </el-select>
      </el-form-item>
      <el-form-item label="服务地址" v-model="form.baseURL" v-if="form.server === 'writingServer'">
        <el-input v-model="form.baseURL"></el-input>
      </el-form-item>
      <el-form-item label="授权" v-if="form.server === 'fileSystem'">
        <el-button @click="requestFileSystem">选择本地文件夹</el-button>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" style="margin-left:auto" @click="save">保存</el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<script lang="ts" setup>
import router from '@/router';
import { initService, LocalStorageKey, service } from '@/services';
import type { FileSystemService } from '@/services/fs';
import { createService } from '@/services/service';
import { ElForm, ElFormItem, ElSelect, ElOption, ElInput, ElButton, ElMessage, ElMessageBox } from 'element-plus'
import { ref } from 'vue';

const form = ref({
  server: 'indexedDB',
  baseURL: '',
})

const requestFileSystem = () => {
  const service = createService(form.value as any) as FileSystemService
  service.authDirectory()
}

const save = async () => {
  let service: ReturnType<typeof createService> | null = null
  try {
    service = createService(form.value as any)
  } catch (err) {
    ElMessage.error((err as any as Error).message || (err as any).toString())
    throw err
  }
  if (!service) return
  if (form.value.server === 'fileSystem') {
    // 检查文件夹是否已授权，未授权则提示
    const authorized = await (service as FileSystemService).directoryAuthorized()
    if (!authorized) {
      ElMessageBox.alert('请授权本机文件夹')
      return
    }
  }
  localStorage.setItem(LocalStorageKey, JSON.stringify(form.value))
  initService()
  router.replace({ name: 'admin'})
}

const checkAndRedirect = async () => {
  if (!service) return
  if ('directoryAuthorized' in service && typeof service.directoryAuthorized === 'function') {
    // 检查文件夹是否已授权，未授权则提示
    const authorized = await (service as FileSystemService).directoryAuthorized()
    if (!authorized) return
  }
  initService()
  router.replace({ name: 'admin'})
}

checkAndRedirect()

</script>

<style lang="less" scoped>
</style>