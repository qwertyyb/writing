import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { SYNC_TEMP_FILE } from '../const';
import { QueryEvent, QueryEventJSON } from './sync';

export class SyncStorage {
  static parseArgs = (args: string) => {
    return JSON.parse(args, (key, val) => {
      if (val?.type === 'Buffer' && Array.isArray(val.data)) {
        return Buffer.from(val);
      }
      return val;
    });
  };
  static serialize = (event: QueryEvent): QueryEventJSON => {
    return {
      ...event,
      time: event.time.toISOString(),
      args: JSON.stringify(event.args)
    };
  };

  getData = (): QueryEventJSON[] => {
    if (!existsSync(SYNC_TEMP_FILE)) return [];
    return JSON.parse(readFileSync(SYNC_TEMP_FILE, 'utf-8'));
  };
  setData = (data: QueryEvent[]) => {
    return writeFileSync(SYNC_TEMP_FILE, JSON.stringify(data.map(item => SyncStorage.serialize(item))), 'utf-8');
  };
}

export const syncStorage = new SyncStorage();
