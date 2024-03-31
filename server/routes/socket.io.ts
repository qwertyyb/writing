import { Server } from 'socket.io';
import { ClientToServerEvents, ServerToClientEvents } from '../service/sync';
import { SYNC_KEY } from '../const';
import { localService } from '../service/LocalService';
import { createLogger } from '../utils/logger';

const logger = createLogger('socket.io');

export const io = new Server<ClientToServerEvents, ServerToClientEvents>();

io.on('connection', (socket) => {
  logger.i('new client connected', socket.id);
  if (socket.handshake.query.key !== SYNC_KEY) {
    logger.i('new client: ', socket.id, 'sync key not match');
    return socket.disconnect();
  }
  socket.join('sync');
  // as server
  socket.on('query', async (records, callback) => {
    logger.i('query', records);
    const success = await localService.recv(records);
    callback({ success });
  });
  socket.on('file', async (file, callback) => {
    logger.i('file');
    const success = await localService.replace(file);
    callback({ success });
  });
});
