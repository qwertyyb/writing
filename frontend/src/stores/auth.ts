import { getAuthOptions, login, verifyAuth } from "@/services/auth";
import { startAuthentication } from "@simplewebauthn/browser";
import { defineStore } from "pinia";
import { ElMessage } from'element-plus'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: localStorage.getItem('token') || '',
  }),
  actions: {
    logout() {
      this.token = ''
    },
    async login({ password = '' }) {
      const { data } = await login({ password })
      localStorage.setItem('token', data.token)
      this.token = data.token
    },
    async webAuthnLogin() {
      const { data } = await getAuthOptions()
      if (!data.allowCredentials?.length) {
        return ElMessage.error({
          message: '尚未注册无密码登录'
        })
      }
      const result = await startAuthentication(data)
      const { data: loginResult } = await verifyAuth(result)
      // localStorage.setItem('token', loginResult.token)
      this.token = loginResult.token
    }
  }
})