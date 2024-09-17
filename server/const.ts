import path from 'path';
import { fileURLToPath } from 'node:url';

import { createLogger } from './utils/logger.ts';

const logger = createLogger('const');
const dirname = path.dirname(fileURLToPath(import.meta.url));

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
  GHPublishConfig = 'GHPublishConfig'
}

export const PORT = process.env.PORT || 4080;

export const rootPath = path.resolve(dirname, '../');

export const schemaPath = path.join(rootPath, './prisma');

export const dbPath = path.join(schemaPath, process.env.DATABASE_URL!.replace(/^file:/, ''));

export const backupPath = path.join(rootPath, process.env.BACKUP_PATH!);

export const ENDPOINT = process.env.ENDPOINT;

export const SYNC_KEY = process.env.SYNC_KEY;

export const SYNC_TEMP_FILE = path.join(rootPath, './data/sync.json');

logger.i('path', { rootPath, dbPath, backupPath });