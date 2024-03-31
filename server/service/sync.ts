import { ENDPOINT } from '../const';
import { createLogger } from '../utils/logger';
import { localService } from './LocalService';

const logger = createLogger('endpoint');


export interface QueryEvent {
  sql: string;
  args: any[];
  hash: string; // 此query执行完之后，数据的hash
  time: Date;
}
export interface QueryEventJSON extends Omit<QueryEvent, 'time' | 'args'> {
  time: string;
  args: string;
}

export interface ClientToServerEvents {
  query: (record: QueryEventJSON[], callback: (result: { success: boolean }) => void) => Promise<void>
  file: (file: Buffer, callback: (result: { success: boolean }) => void) => Promise<void>
  latest: (callback: (result: { data: Omit<QueryEvent, 'args'> }) => void) => Promise<void>
  between: (args: { from: Omit<QueryEvent, 'args'>, to: Omit<QueryEvent, 'args'> }, callback: (result: { data: QueryEventJSON[] }) => void) => Promise<void>
}
export interface ServerToClientEvents {
  query: (record: QueryEventJSON[]) => Promise<{ success: boolean }>
}

class SyncTaskService {
  timeout: ReturnType<typeof setTimeout>;

  constructor(private interval = 10 * 60 * 1000) { }

  start = async () => {
    logger.i('start:', ENDPOINT);
    if (ENDPOINT) {
      try {
        await localService.check();
      } catch (err) {
        logger.e('同步失败', err);
      }
      this.timeout = setTimeout(
        () => {
          this.start();
        },
        // 时间随机一下，防止所有的端都在同一时间进行同步
        this.interval * 0.5 + this.interval * Math.random()
      );
    }
  };

  stop = () => {
    logger.i('stop');
    if (this.timeout) {
      clearTimeout(this.timeout);
    }
  };
}

export const syncTaskService = new SyncTaskService();