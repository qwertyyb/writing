import type { IAuthService } from "../types";
import type { RegistrationResponseJSON, PublicKeyCredentialCreationOptionsJSON, PublicKeyCredentialRequestOptionsJSON, AuthenticationResponseJSON } from "@simplewebauthn/types";
import type { createFetch } from "./fetch";

export class AuthService implements IAuthService {
  constructor(private fetch: ReturnType<typeof createFetch>) { }
  [x: string]: Function;

  supportAuth = () => true

  register = ({ password = '' }) => {
    return this.fetch<{ token: string }>('/api/v1/auth/register', {
      method: 'POST',
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify({ password })
    })
  }

  login = ({ password = '' }) => {
    return this.fetch<{ token: string }>('/api/v1/auth/login', {
      method: 'POST',
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify({ password })
    })
  }

  checkLogin = () => this.fetch<{ isLogin: boolean }>('/api/v1/auth/check')

  getCanRegister = () => {
    return this.fetch<{ canRegister: boolean }>('/api/v1/auth/can-register')
  }

  getRegisterOptions = () => {
    return this.fetch<PublicKeyCredentialCreationOptionsJSON>('/api/v1/auth/webauthn/register-options', {
      method: 'POST'
    })
  }

  verifyRegister = (data: { name: string, body: RegistrationResponseJSON }) => {
    return this.fetch<{ verified: boolean }>('/api/v1/auth/webauthn/verify-register', {
      method: 'POST',
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify(data)
    })
  }

  getAuthOptions = () => {
    return this.fetch<PublicKeyCredentialRequestOptionsJSON>('/api/v1/auth/webauthn/auth-options', {
      method: 'POST'
    })
  }

  verifyAuth = (data: AuthenticationResponseJSON) => {
    return this.fetch<{ verified: boolean, token: string }>('/api/v1/auth/webauthn/auth-verify', {
      method: 'POST',
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify(data)
    })
  }
}
