import { apiFetch } from "./fetch"
import type { RegistrationResponseJSON, PublicKeyCredentialCreationOptionsJSON, PublicKeyCredentialRequestOptionsJSON, AuthenticationResponseJSON } from "@simplewebauthn/types";

export const register = ({ password = '' }) => {
  return apiFetch<{ token: string }>('/api/v1/auth/register', {
    method: 'POST',
    headers: {
      'content-type': 'application/json'
    },
    body: JSON.stringify({ password })
  })
}

export const login = ({ password = '' }) => {
  return apiFetch<{ token: string }>('/api/v1/auth/login', {
    method: 'POST',
    headers: {
      'content-type': 'application/json'
    },
    body: JSON.stringify({ password })
  })
}

export const checkLogin = () => apiFetch<{ isLogin: boolean }>('/api/v1/auth/check')

export const getCanRegister = () => {
  return apiFetch<{ canRegister: boolean }>('/api/v1/auth/can-register')
}

export const getRegisterOptions = () => {
  return apiFetch<PublicKeyCredentialCreationOptionsJSON>('/api/v1/auth/webauthn/register-options', {
    method: 'POST'
  })
}

export const verifyRegister = (data: { name: string, body: RegistrationResponseJSON }) => {
  return apiFetch<{ verified: boolean }>('/api/v1/auth/webauthn/verify-register', {
    method: 'POST',
    headers: {
      'content-type': 'application/json'
    },
    body: JSON.stringify(data)
  })
}

export const getAuthOptions = () => {
  return apiFetch<PublicKeyCredentialRequestOptionsJSON>('/api/v1/auth/webauthn/auth-options', {
    method: 'POST'
  })
}

export const verifyAuth = (data: AuthenticationResponseJSON) => {
  return apiFetch<{ verified: boolean, token: string }>('/api/v1/auth/webauthn/auth-verify', {
    method: 'POST',
    headers: {
      'content-type': 'application/json'
    },
    body: JSON.stringify(data)
  })
}