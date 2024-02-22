import { getAuthOptions, login, verifyAuth } from "@/services/auth";
import { startAuthentication } from "@simplewebauthn/browser";
import { defineStore } from "pinia";

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: localStorage.getItem('token') || '',
  }),
  actions: {
    async login({ password = '' }) {
      const { data } = await login({ password })
      localStorage.setItem('token', data.token)
      this.token = data.token
    },
    async webAuthnLogin() {
      const { data } = await getAuthOptions()
      const result = await startAuthentication(data)
      const { data: loginResult } = await verifyAuth(result)
      this.token = loginResult.token
    }
  }
})