import type { Config } from "../types"
import { db } from "./db"

class ConfigService {
  setValue = (key: string, value: string | null) => {
    return db.config.where({ key }).modify({ value })
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