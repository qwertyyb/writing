<template>
  <section class="crypto-view">
    <el-form class="setting-form" label-position="top">
      <el-form-item>
        <el-button class="form-btn" size="small" @click.prevent="generateNewKeys">生成密钥</el-button>
      </el-form-item>
      <el-form-item label="公钥" required>
        <p class="form-message">公钥用于加密数据</p>
        <el-input type="textarea" v-model="form.publicKey" placeholder="-----BEGIN PUBLIC KEY-----&#10;xxxxx&#10;-----END PUBLIC KEY-----" :rows="10"></el-input>
      </el-form-item>
      <el-form-item label="私钥" required>
        <p class="form-message">私钥用于解密公钥加密的数据</p>
        <el-input type="textarea" v-model="form.privateKey" placeholder="-----BEGIN PRIVATE KEY-----&#10;xxxxxxx&#10;-----END PRIVATE KEY-----" :rows="10"></el-input>
      </el-form-item>
      <el-form-item>
        <el-button class="form-btn" type="primary" @click.prevent="submit">保存</el-button>
      </el-form-item>
    </el-form>
  </section>
</template>

<script setup lang="ts">
import { PRIVATE_KEY } from '@/const';
import { hasConfig } from '@/hooks/admin';
import { fetchPublicKey, updatePublicKey } from '@/hooks/github';
import router from '@/router';
import { decrypt, encrypt, generateKeys } from '@/utils/crypto';
import { ElMessage, ElMessageBox, ElLoading } from 'element-plus';
import { tryRunForTuple } from 'try-run-js';
import { ref } from 'vue';

const form = ref({ publicKey: '', privateKey: '' })
let originalPublicKey = { sha: '', publicKey: '' }

const refresh = async () => {
  form.value.privateKey = localStorage.getItem(PRIVATE_KEY) || ''
  const [err, data] = await tryRunForTuple(fetchPublicKey())
  if (err) {
    ElMessage.error(`获取公钥信息失败: ${err.status}`)
    throw err
  }
  form.value.publicKey = data!.publicKey || ''
  originalPublicKey = { ...data! }
}

const generateNewKeys = async () => {
  const [err, keys] = await tryRunForTuple(generateKeys())
  if (err) {
    ElMessage.error(`生成密钥失败, ${err.message}`)
    throw err
  }
  form.value = keys!
}

const testKeys = async (keys: { publicKey: string, privateKey: string }) => {
  const original = window.crypto.randomUUID()
  const [error, encryptedData] = await tryRunForTuple(encrypt(original, keys.publicKey))
  if (error) {
    throw new Error(`用公钥加密失败: ${error.message}`, { cause: error })
  }
  const [derror, result] = await tryRunForTuple(decrypt(encryptedData!, keys.privateKey))
  if (derror) {
    throw new Error(`用公钥加密失败: ${derror.message}`, { cause: derror })
  }
  if (original === result) {
    return true
  }
  throw new Error('公钥加密的内容，私钥无法解密')
}

const submit = async () => {
  const { publicKey, privateKey } = form.value
  if (!publicKey || !privateKey) {
    return ElMessage.error('请填写公钥或私钥信息')
  }
  try {
    await testKeys({ publicKey, privateKey })
  } catch (err) {
    ElMessage.error((err as Error).message)
    throw err
  }
  if (originalPublicKey.publicKey !== publicKey) {
    await ElMessageBox.confirm('密钥修改后，原加密的内容将无法解密，确认修改吗？', '警告', { type: 'warning' })
  }
  const loading = ElLoading.service({ fullscreen: true, text: '正在更新公钥，请勿关闭页面...' })
  if (publicKey) {
    // 公钥推到远端
    const [error] = await tryRunForTuple(updatePublicKey(publicKey))
    if (error) {
      loading.close()
      ElMessage.error('更新失败, ' + error.message)
      throw error
    }
  }
  if (privateKey) {
    // 私钥保存本地
    localStorage.setItem(PRIVATE_KEY, privateKey)
  }
  loading.close()
}

if (hasConfig()) {
  refresh()
} else {
  router.replace({ name: 'admin' })
}

</script>

<style lang="less" scoped>
.setting-form {
  max-width: 600px;
  margin: 60px auto 0 auto;
}
.form-message {
  margin: 0;
  opacity: 0.5;
}
.form-btn {
  margin-left: auto;
}
</style>