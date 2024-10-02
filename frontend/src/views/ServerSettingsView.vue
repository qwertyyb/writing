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
      <template v-if="form.server === 'fileSystem'">
        <el-form-item label="类型">
          <el-select v-model="form.adapter">
            <el-option value="local" label="本机文件夹"></el-option>
            <el-option value="github" label="Github"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="授权" v-if="form.adapter === 'local'">
          <el-alert type="success"
            :closable="false"
            v-if="runtimeValue.authorizedDirectoryName !== null"
          >已授权文件夹：{{ runtimeValue.authorizedDirectoryName || '未知文件夹' }}</el-alert>
          <br><br>
          <el-button @click="requestFileSystem">选择本地文件夹</el-button>
        </el-form-item>
        <el-form-item label="token" v-if="form.adapter === 'github'">
          <el-input v-model.trim="form.auth" placeholder="请填写 Github Token"></el-input>
        </el-form-item>
        <el-form-item label="仓库owner" v-if="form.adapter === 'github'">
          <el-input v-model.trim="form.owner" placeholder="请填写 Github 仓库owner"></el-input>
        </el-form-item>
        <el-form-item label="仓库名repo" v-if="form.adapter === 'github'">
          <el-input v-model.trim="form.repo" placeholder="请填写 Github 仓库repo"></el-input>
        </el-form-item>
      </template>
      <el-form-item>
        <el-button type="primary" style="margin-left:auto" @click="save">保存</el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<script lang="ts" setup>
import router from '@/router';
import { initService, LocalStorageKey, service } from '@/services';
import { FileSystemService } from '@/services/fs';
import { createService } from '@/services/service';
import { logger } from '@/utils/logger';
import { ElForm, ElFormItem, ElSelect, ElOption, ElInput, ElButton, ElMessage, ElMessageBox, ElAlert } from 'element-plus'
import { ref } from 'vue';

const props = withDefaults(defineProps<{ redirect: boolean }>(), { redirect: true })

const form = ref<{
  server: 'indexedDB' | 'fileSystem' | 'writingServer',
  baseURL: string,
  adapter: 'local' | 'github',
  auth: string,
  owner: string,
  repo: string,
}>({
  server: 'indexedDB',
  baseURL: '',
  adapter: 'local', // local | github
  auth: '',
  owner: '',
  repo: ''
})

const runtimeValue = ref<{
  authorizedDirectoryName: string | null
}>({
  authorizedDirectoryName: null,
})

const initFormValue = () => {
  try {
    const local = localStorage.getItem(LocalStorageKey)
    if (!local) return
    form.value = JSON.parse(local)
    if (service && service instanceof FileSystemService) {
      runtimeValue.value.authorizedDirectoryName = service.authorizedDirectoryName()
    }
  } catch (err) {
    logger.e(err)
    return
  }
}

initFormValue()

const requestFileSystem = async () => {
  const service = createService(form.value as any) as FileSystemService
  await service.authDirectory()
  runtimeValue.value.authorizedDirectoryName = service.authorizedDirectoryName()
}

const save = async () => {
  let tempService: ReturnType<typeof createService> | null = null
  try {
    tempService = createService(form.value as any)
  } catch (err) {
    ElMessage.error((err as any as Error).message || (err as any).toString())
    throw err
  }
  if (!tempService) return
  if (form.value.server === 'fileSystem') {
    // 检查文件夹是否已授权，未授权则提示
    const authorized = await (tempService as FileSystemService).directoryAuthorized()
    if (!authorized) {
      ElMessageBox.alert('请授权本机文件夹')
      return
    }
  }
  if (service) {
    // 更新配置，保存后刷新下页面
    await ElMessageBox.confirm('保存后页面将刷新，确认保存吗？')
  }
  localStorage.setItem(LocalStorageKey, JSON.stringify(form.value))
  if (service) {
    // 已有，刷新页面
    location.reload()
  } else {
    // 未有，可直接跳走
    initService()
    router.replace({ name: 'admin'})
  }
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

if (props.redirect) {
  checkAndRedirect()
}

</script>

<style lang="less" scoped>
</style>