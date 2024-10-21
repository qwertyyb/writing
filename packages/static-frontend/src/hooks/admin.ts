import { computed, ref } from "vue";
import localforage from 'localforage'
import { ADMIN_STORAGE_KEY } from "@/const";

export const adminConfig = ref({
  token: '', owner: '', repo: '', cryptoKey: '',
})

export const hasConfig = () => {
  return adminConfig.value.token && adminConfig.value.owner && adminConfig.value.repo
}

const loadConfig = () => {
  const data = localStorage.getItem(ADMIN_STORAGE_KEY)
  if (!data) return
  adminConfig.value = JSON.parse(data)
}

loadConfig()

export const useAdminConfig = () => {

  const saveConfig = async (config: { token: string, owner: string, repo: string, cryptoKey: string }) => {
    await localStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(config))
    loadConfig()
  }

  const clearConfig = async () => {
    await localforage.removeItem(ADMIN_STORAGE_KEY)
    adminConfig.value = { token: '', owner: '', repo: '', cryptoKey: '' }
  }

  return {
    config: adminConfig,
    loadConfig,
    saveConfig,
    clearConfig,
    hasConfig: computed(hasConfig),
    hasCryptoKey: computed(() => adminConfig.value.cryptoKey)
  }
}
