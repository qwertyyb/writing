import { configService } from "@/services";
import { debounce } from "lodash-es";
import { defineStore } from "pinia";
import * as R from 'ramda'

interface RuntimeSettings {
  layout: { siderWidth: number, collapsed: boolean }
  recentDocumentId: number
}

const debounceSetValue = debounce(configService.setValue, 200)

const defaultSettings = () => ({
  layout: {
    siderWidth: 25,
    collapsed: false,
  },
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
      if (R.equals(this.settings[key], value)) return;
      this.settings[key] = value
      localStorage.setItem('runtime', JSON.stringify(this.settings))
      return debounceSetValue('settings', JSON.stringify(this.settings))
    },
    async refresh() {
      const value = await configService.getValue('settings')
      if (value) {
        this.settings = R.mergeDeepLeft<RuntimeSettings, RuntimeSettings>(this.settings, JSON.parse(value))
      }
    }
  }
})