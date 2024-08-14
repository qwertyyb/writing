import { authService } from "@/services";
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
      localStorage.removeItem('token')
    },
    async login({ password = '' }) {
      const { data } = await authService.login({ password })
      localStorage.setItem('token', data.token)
      this.token = data.token
    },
    async webAuthnLogin(browserAutofill = false) {
      const { data } = await authService.getAuthOptions()
      if (!data.allowCredentials?.length) {
        return ElMessage.error({
          message: '尚未注册无密码登录'
        })
      }
      const result = await startAuthentication(data, browserAutofill)
      const { data: loginResult } = await authService.verifyAuth(result)
      localStorage.setItem('token', loginResult.token)
      this.token = loginResult.token
    }
  }
})