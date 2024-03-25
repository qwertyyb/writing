import path from 'path';

export const RP_NAME = 'writing webauthn';
export const RP_ID = 'localhost';
export const ORIGIN = `http://${RP_ID}`;

export const USER_ID = 'root';
export const USER_NAME = 'root';

export enum ConfigKey {
  Password = 'Password',
  PasswordDisabled = 'PasswordDisabled',
  WebAuthnChallenge = 'WebAuthnChallenge',
  WebauthnAuthenticators = 'WebAuthnAuthenticators',
}

export const dbPath = path.join(__dirname, process.env.DATABASE_URL.replace(/^file:/, ''));