import { apiFetch } from "./fetch"

export const login = ({ password = '' }) => {
  return apiFetch<{ token: string }>('/api/v1/auth/login', {
    method: 'POST',
    headers: {
      'content-type': 'application/json'
    },
    body: JSON.stringify({ password })
  })
}