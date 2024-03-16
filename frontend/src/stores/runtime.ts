import { getValue, setValue } from "@/services/config";
import { debounce } from "@/utils/utils";
import { defineStore } from "pinia";
import * as R from 'ramda'

interface RuntimeSettings {
  layout: { siderWidth: number }
  recentDocumentId: number
}

const debounceSetValue = debounce(setValue)

const defaultSettings = () => ({
  layout: { siderWidth: 25 },
  recentDocumentId: 1
})

export const useRuntime = defineStore('runtime', {
  state() {
    return {
      settings: defaultSettings()
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
        this.settings = R.mergeDeepRight<RuntimeSettings, RuntimeSettings>(JSON.parse(value), defaultSettings())
      }
    }
  }
})