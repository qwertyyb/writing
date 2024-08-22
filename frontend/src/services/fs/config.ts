import type { IConfigService } from "../types";
import { low } from "./fs";

class ConfigService implements IConfigService {
  setValue = async (key: string, value: string | null) => {
    await low.update((meta) => {
      const config = meta.config.find(i => i.key === key)
      if (config) {
        config.value = value ?? ''
      } else {
        meta.config.push({ key, value: value || '' })
      }
    })
    return { errCode: 0, errMsg: 'ok', data: { value: value ?? ''} }
  }
  getValue = async (key: string) => {
    return low.data.config.find(i => i.key === key)?.value
  }
  getValues = async (keys: string[]) => {
    return low.data.config.filter(i => keys.includes(i.key))
  }
}

export const configService = new ConfigService()