import { execSync } from 'child_process';
import path from 'path';
import { dbPath } from '../const';

export const createRes = <D>(data: D, errCode = 0, errMsg = 'ok') => ({
  errCode,
  errMsg,
  data,
});

export const dbhash = () => execSync(path.join(__filename, '../../../bin/dbhash') + ' ' + dbPath, { encoding: 'utf-8' }).split(' ')?.[0] || '';
