import { readFileSync } from 'node:fs';
import { ENDPOINT, dbPath } from '../const';
import { ClientToServerEvents, QueryEvent, QueryEventJSON, ServerToClientEvents } from './sync';
import { createLogger } from '../utils/logger';
import { io, Socket } from 'socket.io-client';
import querystring from 'node:querystring';
import { localService } from './LocalService';

const logger = createLogger('EndpointService');

export class EndpointService {
  private client: Socket | null;

  constructor() {
    if (!ENDPOINT) return;

    logger.i('connect to server', ENDPOINT);
    const url = new URL(ENDPOINT);
    const client: Socket<ClientToServerEvents, ServerToClientEvents> = io(url.origin, {
      path: url.pathname,
      query: querystring.parse(url.search.substring(1))
    });

    client.on('connect', () => {
      logger.i('connect to server successfully');
    });
    client.on('disconnect', (reason) => {
      logger.w('disconnect', reason);
    });
    client.on('connect_error', err => {
      logger.e('connect error', err.message);
    });
    client.on('query', async (event, callback) => {
      const success = await localService.recv(event);
      callback?.({ success });
    });

    this.client = client;
  }

  getLatest = async (): Promise<QueryEvent> => {
    const { data: record } = await this.client.emitWithAck('latest');

    return {
      ...record,
      args: JSON.parse(record.args),
      time: new Date(record.time),
    };
  };
  replace = async () => {
    logger.i('replace');
    return this.client.emitWithAck('file', readFileSync(dbPath));
  };

  // 从远端把records拉下来进行同步
  pull = async (
    from: Omit<QueryEvent, 'args'>,
    to: Omit<QueryEvent, 'args'>
  ) => {
    const { data: records } = await this.client.emitWithAck('between', { from, to });
    return records;
  };

  query = async (records: QueryEventJSON[]): Promise<{ success: boolean }> => {
    return this.client.emitWithAck('query', records);
  };
}

export const endpointService = new EndpointService();