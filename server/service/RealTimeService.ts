import { ENDPOINT } from '../const';
import { io } from '../routes/socket.io';
import { createLogger } from '../utils/logger';
import { endpointService } from './EndpointService';
import { QueryEvent } from './sync';
import { SyncStorage, syncStorage } from './SyncStorage';

const logger = createLogger('RealTimeService');

// 实时同步服务
export class RealTimeSyncService {
  private queue: QueryEvent[] = [];
  private chain: Promise<void> = Promise.resolve();

  constructor() {
    const queue = syncStorage.getData();
    queue.forEach(event => {
      this.query({
        ...event,
        args: SyncStorage.parseArgs(event.args),
        time: new Date(event.time)
      });
    });
  }

  query = (event: QueryEvent) => {
    if (!ENDPOINT) {
      this.chain = this.chain.then(async () => {
        // 作为服务端向客户端发送消息
        logger.i('query to client sockets', (await io.to('sync').fetchSockets()).map(item => item.id));
        io.to('sync').emit('query', [SyncStorage.serialize(event)]);
      });
      return this.chain;
    }

    this.queue.push(event);
    this.writeToFile();

    this.chain = this.chain.then(async () => {
      logger.i('query start', event.sql);
      // 作为服务端向客户端发送消息
      logger.i('query to client sockets', (await io.to('sync').fetchSockets()).map(item => item.id));
      io.to('sync').emit('query', [SyncStorage.serialize(event)]);

      // 作为客户端向服务端推送消息
      const data = await endpointService.query([SyncStorage.serialize(event)]);
      logger.i('query end', data);
      if (data.success) {
        // 远程执行成功，从队列中移除
        this.queue.shift();
        this.writeToFile();
        return;
      }
      if (!data.success) {
        // 远程执行SQL失败了，把整个文件推上去
        this.errorHandler();
        throw new Error('endpoint query failed: ');
      }
    });
    return this.chain;
  };

  errorHandler = () => {
    logger.i('errorHandler');
    this.queue = [];
    this.writeToFile();
    this.chain = endpointService.replace().then(() => {});
  };

  private writeToFile = () => {
    syncStorage.setData(this.queue);
  };
}

export const realTimeService = new RealTimeSyncService();
