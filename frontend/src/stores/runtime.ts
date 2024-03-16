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

const localSettgings = () => {
  try {
    return JSON.parse(localStorage.getItem('runtime') || '{}')
  } catch(_) {
    return {}
  }
}

export const useRuntime = defineStore('runtime', {
  state() {
    return {
      settings: R.mergeDeepLeft(localSettgings(), defaultSettings())
    }
  },
  actions: {
    updateSettings<K extends keyof RuntimeSettings>(key: K, value: RuntimeSettings[K]) {
      this.settings[key] = value
      localStorage.setItem('runtime', JSON.stringify(this.settings))
      return debounceSetValue('settings', JSON.stringify(this.settings))
    },
    async refresh() {
      const value = await getValue('settings')
      if (value) {
        this.settings = R.mergeDeepLeft<RuntimeSettings, RuntimeSettings>(this.settings, JSON.parse(value))
      }
    }
  }
})