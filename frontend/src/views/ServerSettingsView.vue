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
        <el-row style="flex: 1">
          <el-col :span="19">
            <el-alert title="修改服务配置需要刷新页面" type="info" :closable="false" />
          </el-col>
          <el-button type="primary" style="margin-left:auto">保存</el-button>
        </el-row>
      </el-form-item>
    </el-form>
  </div>
</template>

<script lang="ts" setup>
import { ElForm, ElFormItem, ElSelect, ElOption, ElInput, ElButton, ElAlert, ElRow, ElCol } from 'element-plus'
import { ref } from 'vue';

interface WritingServerConfig {
  server: 'writingServer'
  baseURL: ''
}

interface IndexedDBConfig {
  server: 'indexedDB'
}

interface FileSystemConfig {
  server: 'fileSystem',
}

type ServerConfig = WritingServerConfig | IndexedDBConfig | FileSystemConfig

const form = ref({
  server: 'indexedDB',
  baseURL: '',
})

const requestFileSystem = () => {

}

</script>

<style lang="less" scoped>
</style>