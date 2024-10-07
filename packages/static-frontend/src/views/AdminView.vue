<template>
  <div class="admin-view flex flex-col">
    <div class="setting-list m-auto w-80">
      <el-form label-position="top" class="setting-form">
        <el-form-item label="Token">
          <div class="setting-input">
            <el-input v-model="form.token" id="token"></el-input>
            <div class="setting-message">Github Personal Token</div>
          </div>
        </el-form-item>
        <el-form-item label="Owner">
          <div class="setting-input">
            <el-input v-model="form.owner" id="owner"></el-input>
            <div class="setting-message">Github User</div>
          </div>
        </el-form-item>
        <el-form-item label="Repo">
          <div class="setting-input">
            <el-input v-model="form.repo" id="repo"></el-input>
            <div class="setting-message">Github Repo</div>
          </div>
        </el-form-item>
        <div class="setting-item mt-8">
          <el-button @click="clear">清除</el-button>
          <el-button type="primary" @click="submit" v-loading="loading">保存</el-button>
        </div>
      </el-form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import 'element-plus/es/components/message/style/css'
import 'element-plus/es/components/message-box/style/css'
import { ElMessage, ElMessageBox } from "element-plus";
import { tryRunForTuple } from 'try-run-js'
import { Octokit } from "@octokit/rest";
import { useAdminConfig } from '@/hooks/admin';

const { config, saveConfig, clearConfig } = useAdminConfig()

const form = ref({
  token: '',
  owner: '',
  repo: '',
})

const loading = ref(false)

const initForm = () => {
  form.value = {
    ...config.value
  }
}

initForm()

const submit = async () => {
  const { token, owner, repo } = form.value
  if (!token || !owner || !repo) return window.alert('请正确填Token、Owner和Repo')
  loading.value = true
  const github = new Octokit({
    auth: token,
  })
  let [error, resp] = await tryRunForTuple(github.repos.get({ owner, repo }))
  if (error) {
    ElMessage.error('获取仓库信息失败，请检查配置是否正确')
    throw error
  }
  const defaultBranch = resp!.data.default_branch;
  const [treeError, treeResp] = await tryRunForTuple(github.git.getTree({ owner, repo, tree_sha: defaultBranch }))
  if (treeError || treeResp?.status !== 200) {
    ElMessage.error('获取仓库数据失败，请检查配置是否正确')
    throw (treeError || new Error(`Get Repo Tree: ${treeResp?.status}`))
  }

  saveConfig(form.value)
  ElMessage.success('保存成功')
  loading.value = false
}

const clear = async () => {
  await ElMessageBox.confirm('清空后，将无法再进行编辑或发布，确认清空配置？', '提示')
  clearConfig()
  form.value = { token: '', owner: '', repo: '' }
}

</script>

<style lang="less" scoped>
.setting-form {
  max-width: 600px;
  margin: 0 auto;
}
.setting-input {
  width: 100%;
}
.setting-message {
  font-size: 13px;
  color: rgba(0, 0, 0, .5);
}
</style>

