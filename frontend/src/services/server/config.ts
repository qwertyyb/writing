import type { IConfigService } from "../types";
import type { createFetch } from "./fetch";

export class ConfigService implements IConfigService {
  constructor(private fetch: ReturnType<typeof createFetch>) { }
  setValue = (key: string, value: string | null) => this.fetch<{ value: string | null }>('/api/v1/config/update', {
    method: 'POST',
    headers: {
      'content-type': 'application/json'
    },
    body: JSON.stringify({ key, value })
  })
  getValue = async (key: string) => {
    const search = new URLSearchParams()
    search.set('key', key)
    const { data } = await this.fetch<{ value: string; } | null>('/api/v1/config/get?' + search.toString());
    return data?.value;
  }
  getValues = async (keys: string[]) => {
    const search = new URLSearchParams()
    search.set('keys', JSON.stringify(keys))
    const { data } = await this.fetch<{ key: string; value: string; }[]>('/api/v1/config/gets?' + search.toString());
    return data;
  }
}
