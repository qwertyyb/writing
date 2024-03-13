<template>
  <div class="auth-view">
    <el-form :model="form" label-position="top" class="auth-form" @submit.prevent>
      <el-form-item label="密码">
        <el-input placeholder="请输入密码" type="password" v-model="form.password" @keydown.enter="login"></el-input>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="login">登录</el-button>
        <el-button type="success" @click="webAuthnLogin" v-if="supportsWebAuthn && !canRegisterWebAuthn">无密码登录</el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<script lang="ts" setup>
import { useAuthStore } from '@/stores/auth';
import { ElMessage } from 'element-plus';
import { ref } from 'vue';
import { browserSupportsWebAuthn } from '@simplewebauthn/browser';
import router from '@/router';
import { checkLogin as checkLoginApi, getCanRegisterWebAuthn} from '@/services/auth';

const authStore = useAuthStore()

const form = ref({ password: '' })
const supportsWebAuthn = ref(browserSupportsWebAuthn())
const canRegisterWebAuthn = ref(false)

const redirectAfterLogin = () => {
  console.log(router.currentRoute.value, router.currentRoute.value.query.ru)
  router.replace(router.currentRoute.value.query.ru as string | undefined || '/admin')
}

const login = async () => {
  if (!form.value.password.trim()) {
    return ElMessage.warning('请输入密码')
  }
  await authStore.login(form.value)
  redirectAfterLogin()
}

const refreshCanRegisterWebAuthn = async () => {
  const { data } = await getCanRegisterWebAuthn()
  canRegisterWebAuthn.value = data.canRegister
}

refreshCanRegisterWebAuthn()

const webAuthnLogin = async () => {
  await authStore.webAuthnLogin()
  redirectAfterLogin()
}

const checkLogin = async () => {
  const { data } = await checkLoginApi()
  if (data.isLogin) {
    redirectAfterLogin()
  } else {
    authStore.logout()
  }
}

checkLogin()

</script>

<style lang="less" scoped>
.auth-form {
  width: 80%;
  margin: 60px auto 0 auto;
  max-width: 360px;
}
</style>