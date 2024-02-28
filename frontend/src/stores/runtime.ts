import { getValue, setValue } from "@/services/config";
import { createLogger } from "@/utils/logger";
import { debounce } from "@/utils/utils";
import { defineStore } from "pinia";

interface RuntimeSettings {
  layout: { siderWidth: number }
}

interface Runtime {
  settings: RuntimeSettings
}

const logger = createLogger('runtime')

const debounceSetValue = debounce(setValue)

export const useRuntime = defineStore('runtime', {
  state() {
    return {
      settings: {
        layout: { siderWidth: 25 }
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
      logger.i('refresh, settings: ', value)
      if (value) {
        this.settings = JSON.parse(value)
      }
    }
  }
})