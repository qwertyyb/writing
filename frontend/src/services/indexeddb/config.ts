import type { Config, IConfigService } from "../types"
import { db } from "./db"

class ConfigService implements IConfigService {
  setValue = (key: string, value: string | null) => {
    return db.config.where({ key }).modify({ value: value ?? undefined }).then((result) => {
      if (result > 0) return { errCode: 0, errMsg: 'ok', data: { key, value } }
      throw new Error(`setValue failed: ${key} ${value}`)
    })
  }
  getValue = async (key: string) => {
    const row = await (db.config.where({ key }).first as unknown as Promise<Config>)
    return row?.value
  }
  getValues = async (keys: string[]) => {
    return db.config.where('key').anyOf(keys).toArray()
  }
}

export const configService = new ConfigService()