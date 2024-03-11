import { getValue, setValue } from "@/services/config";
import { debounce } from "@/utils/utils";
import { defineStore } from "pinia";

interface RuntimeSettings {
  layout: { siderWidth: number }
  recentDocumentId: number
}

const debounceSetValue = debounce(setValue)

export const useRuntime = defineStore('runtime', {
  state() {
    return {
      settings: {
        layout: { siderWidth: 25 },
        recentDocumentId: 0
      }
    }
  },
  actions: {
    updateSettings<K extends keyof RuntimeSettings>(key: K, value: RuntimeSettings[K]) {
      this.settings[key] = value
      return debounceSetValue('settings', JSON.stringify(this.settings))
    },
    async refresh() {
      const value = await getValue('settings')
      if (value) {
        this.settings = JSON.parse(value)
      }
    }
  }
})