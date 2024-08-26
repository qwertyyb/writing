<template>
  <div class="auth-view">
    <el-form :model="form" label-position="top"
      class="auth-form"
      v-if="canRegister"
      @submit.prevent>
      <el-form-item label="密码">
        <el-input placeholder="请输入密码" type="password" v-model.trim="form.password" @keydown.enter="login"></el-input>
      </el-form-item>
      <el-form-item label="重复密码">
        <el-input placeholder="请重复密码" type="password" v-model.trim="form.password2" @keydown.enter="login"></el-input>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="register">注册</el-button>
        <el-button type="success" @click="addAuthenticator" v-if="supportsWebAuthn">无密码注册</el-button>
      </el-form-item>
    </el-form>
    <el-form :model="form" label-position="top"
      v-else
      class="auth-form"
      @submit.prevent>
      <el-form-item label="密码">
        <el-input placeholder="请输入密码" type="password"
          autocomplete="current-password webauthn"
          v-model="form.password"
          @keydown.enter="login"></el-input>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="login">登录</el-button>
        <el-button type="success" @click="webAuthnLogin" v-if="supportsWebAuthn">无密码登录</el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<script lang="ts" setup>
import { useAuthStore } from '@/stores/auth';
import { ElMessage, ElMessageBox } from 'element-plus';
import { ref } from 'vue';
import { browserSupportsWebAuthn, browserSupportsWebAuthnAutofill, startRegistration } from '@simplewebauthn/browser';
import router from '@/router';
import { service } from '@/services';

const authStore = useAuthStore()

const form = ref({ password: '', password2: '' })
const supportsWebAuthn = ref(browserSupportsWebAuthn())
const canRegister = ref(false)

const register = async () => {
  const { password, password2 } = form.value
  if (!password.trim()) {
    return ElMessage.error('请输入密码')
  }
  if (password !== password2) {
    return ElMessage.error('两次密码输入不一致')
  }
  await service.authService.register({ password })
  ElMessage.success('注册成功，请输入密码登录')
  form.value.password = ''
  refreshCanRegister()
}

const webAuthnRegister = async (name: string) => {
  const { data } = await service.authService.getRegisterOptions()
  const result = await startRegistration(data)
  await service.authService.verifyRegister({ name, body: result })
}

const addAuthenticator = async () => {
  const { value: inputValue } = await ElMessageBox.prompt('请输入设备名', 'Tip', {
    confirmButtonText: '确认',
    cancelButtonText: '取消',
    inputPattern: /\w+/,
    inputErrorMessage: '请输入设备名',
    inputPlaceholder: '请输入设备名'
  })
  await webAuthnRegister(inputValue.trim())
  ElMessage.success('注册成功，请登录')
  refreshCanRegister()
}

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

const refreshCanRegister = async () => {
  const { data } = await service.authService.getCanRegister()
  canRegister.value = data.canRegister
}

refreshCanRegister()

const webAuthnLogin = async () => {
  await authStore.webAuthnLogin()
  redirectAfterLogin()
}

const checkLogin = async () => {
  const { data } = await service.authService.checkLogin()
  if (data.isLogin) {
    redirectAfterLogin()
  } else {
    authStore.logout()
  }
}

checkLogin()

const autofill = async () => {
  const support = await browserSupportsWebAuthnAutofill()
  if (!support) return
  await authStore.webAuthnLogin(true)
  redirectAfterLogin()
}

autofill()

</script>

<style lang="less" scoped>
.auth-form {
  width: 80%;
  margin: 60px auto 0 auto;
  max-width: 360px;
}
</style>