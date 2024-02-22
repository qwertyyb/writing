<template>
  <div class="auth-view">
    <el-form :model="form" label-position="top" class="auth-form" @submit.prevent>
      <el-form-item label="密码">
        <el-input placeholder="请输入密码" type="password" v-model="form.password" @keydown.enter="login"></el-input>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="login">登录</el-button>
        <el-button @click="webAuthnLogin" v-if="supportsWebAuthn">无密码登录</el-button>
        <el-button @click="webAuthnRegister" v-if="supportsWebAuthn">无密码注册</el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<script lang="ts" setup>
import { useAuthStore } from '@/stores/auth';
import { ElMessage } from 'element-plus';
import { ref } from 'vue';
import { startRegistration, startAuthentication, browserSupportsWebAuthn } from '@simplewebauthn/browser';
import router from '@/router';
import { getAuthOptions, getRegisterOptions, verifyRegister } from '@/services/auth';

const authStore = useAuthStore()

const form = ref({ password: '' })
const supportsWebAuthn = ref(browserSupportsWebAuthn())

const login = async () => {
  if (!form.value.password.trim()) {
    return ElMessage.warning('请输入密码')
  }
  await authStore.login(form.value)
  router.replace(router.currentRoute.value.query.ru as string | undefined || '/home')
}

const webAuthnLogin = async () => {
  const { data } = await getAuthOptions()
  const result = await startAuthentication(data)
  console.log(result)
}

const webAuthnRegister = async () => {
  const { data } = await getRegisterOptions()
  const result = await startRegistration(data)
  const { data: regResult } = await verifyRegister(result)
  console.log(data, regResult)
}

</script>

<style lang="less" scoped>
.auth-form {
  width: 80%;
  margin: 60px auto 0 auto;
  max-width: 360px;
}
</style>