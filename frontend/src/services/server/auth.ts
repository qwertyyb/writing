import type { IAuthService } from "../types";
import { apiFetch } from "./fetch"
import type { RegistrationResponseJSON, PublicKeyCredentialCreationOptionsJSON, PublicKeyCredentialRequestOptionsJSON, AuthenticationResponseJSON } from "@simplewebauthn/types";

const supportAuth = () => true

const register = ({ password = '' }) => {
  return apiFetch<{ token: string }>('/api/v1/auth/register', {
    method: 'POST',
    headers: {
      'content-type': 'application/json'
    },
    body: JSON.stringify({ password })
  })
}

const login = ({ password = '' }) => {
  return apiFetch<{ token: string }>('/api/v1/auth/login', {
    method: 'POST',
    headers: {
      'content-type': 'application/json'
    },
    body: JSON.stringify({ password })
  })
}

const checkLogin = () => apiFetch<{ isLogin: boolean }>('/api/v1/auth/check')

const getCanRegister = () => {
  return apiFetch<{ canRegister: boolean }>('/api/v1/auth/can-register')
}

const getRegisterOptions = () => {
  return apiFetch<PublicKeyCredentialCreationOptionsJSON>('/api/v1/auth/webauthn/register-options', {
    method: 'POST'
  })
}

const verifyRegister = (data: { name: string, body: RegistrationResponseJSON }) => {
  return apiFetch<{ verified: boolean }>('/api/v1/auth/webauthn/verify-register', {
    method: 'POST',
    headers: {
      'content-type': 'application/json'
    },
    body: JSON.stringify(data)
  })
}

const getAuthOptions = () => {
  return apiFetch<PublicKeyCredentialRequestOptionsJSON>('/api/v1/auth/webauthn/auth-options', {
    method: 'POST'
  })
}

const verifyAuth = (data: AuthenticationResponseJSON) => {
  return apiFetch<{ verified: boolean, token: string }>('/api/v1/auth/webauthn/auth-verify', {
    method: 'POST',
    headers: {
      'content-type': 'application/json'
    },
    body: JSON.stringify(data)
  })
}

export const authService = { supportAuth, register, login, checkLogin, getCanRegister, getRegisterOptions, verifyRegister, getAuthOptions, verifyAuth } as IAuthService
