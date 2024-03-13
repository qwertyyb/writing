import { apiFetch } from "./fetch";

export const setValue = (key: string, value: string) => apiFetch<{ value: string }>('/api/v1/config/update', {
  method: 'POST',
  headers: {
    'content-type': 'application/json'
  },
  body: JSON.stringify({ key, value })
})

export const getValue = (key: string) => {
  const search = new URLSearchParams()
  search.set('key', key)
  return apiFetch<{ value: string } | null>('/api/v1/config/get?' + search.toString()).then(({ data }) => data?.value)
}

export const getValues = (keys: string[]) => {
  const search = new URLSearchParams()
  search.set('keys', JSON.stringify(keys))
  return apiFetch<{ key: string, value: string }[]>('/api/v1/config/gets?' + search.toString()).then(({ data }) => data)
}
