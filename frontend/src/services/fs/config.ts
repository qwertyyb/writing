import type { Low } from "lowdb";
import type { IConfigService } from "../types";
import type { Database } from "./fs";

export class ConfigService implements IConfigService {
  constructor(private low: Low<Database>) {}
  setValue = async (key: string, value: string | null) => {
    await this.low.update((meta) => {
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
    return this.low.data.config.find(i => i.key === key)?.value
  }
  getValues = async (keys: string[]) => {
    return this.low.data.config.filter(i => keys.includes(i.key))
  }
}
