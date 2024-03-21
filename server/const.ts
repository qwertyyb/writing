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