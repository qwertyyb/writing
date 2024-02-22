import { login } from "@/services/auth";
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
    }
  }
})