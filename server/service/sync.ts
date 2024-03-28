import axios from 'axios';
import { ENDPOINT, backupPath, dbPath } from '../const';
import { SQLHistory } from '@prisma/client';
import { copyFileSync, openAsBlob } from 'fs';
import { createLogger } from '../utils/logger';
import Database from 'better-sqlite3';
import { prisma } from '../prisma';
import { dbhash } from '../utils';
import path from 'path';
import { adapter } from '../prisma/adapter';
import type { File } from 'formidable';

const logger = createLogger('endpoint');

const request = axios.create({
  url: ENDPOINT
});

request.interceptors.response.use(response => {
  const { data } = response;
  if (data.errCode === 0) {
    return data;
  }
  throw new Error('request failed: ' + data.errMsg + data.errCode);
});

class EndpointService {
  getLatest = async (): Promise<Omit<SQLHistory, 'params' | 'sql'>> => {
    const { data: record } = await request.get(ENDPOINT);

    return {
      ...record,
      createdAt: new Date(record.createdAt),
      updatedAt: new Date(record.updatedAt),
    };
  };
  replace = async () => {
    const formData = new FormData();
    formData.append('type', 'file');
    formData.append('file', await openAsBlob(dbPath));
    return request.post(ENDPOINT, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  };

  // 从远端把records拉下来进行同步
  pull = async (
    from: Omit<SQLHistory, 'params' | 'sql'>,
    to: Omit<SQLHistory, 'params' | 'sql'>
  ) => {
    const { data: records } = await request.post(ENDPOINT, { type: 'between', from, to });
    return records;
  };
}


enum SyncState {
  Idle = 0,
  Recving = 2,
  Replacing = 4
}

class LocalService {
  state: SyncState = SyncState.Idle;
  db: Database.Database;

  constructor() {
    this.db = new Database(dbPath);
  }

  getLatest = () => {
    return prisma.sQLHistory.findFirst({
      orderBy: { createdAt: 'desc' },
      select: { id: true, createdAt: true, updatedAt: true, sql: true, checksum: true, comment: true }
    });
  };

  check = async () => {
    logger.i('check start');
    this.checkState();
    const latest = await this.getLatest();
    const lastOperateTime = latest?.createdAt.getTime() ?? 0;
    // 检查远端最新记录
    const remoteRecord = await endpointService.getLatest();
    logger.i('local and remote: ', latest, remoteRecord);

    if (remoteRecord.createdAt.getTime() > lastOperateTime) {
      // 远端最后操作时间比本地最后时间大，则说明远端比较新
      // 把本地的最新记录和远端记录发给远端，获取这之间的所有变更
      const records = await endpointService.pull(latest, remoteRecord);
      logger.i('pull remote to local', records.length);

      // 如果records为空，则说明，本地的最新记录不在远端的记录历史中，也就是说本地和远端有了两个分支
      // 这种情况，需要首先把远端文件备份，然后把本地整个文件同步给远端
      if (records.length) {
        return this.recv(records);
      }
      // 把整个文件传给远端
      await endpointService.replace();
      return;
    }
    if (remoteRecord.createdAt.getTime() < lastOperateTime) {
      // 本地最后操作时间比远端最后操作时间大，说明本地比较新
      // 把本地的 records 传给远端,让远端进行同步
      const records = await this.getRecordsBetween(remoteRecord, latest);
      logger.i('push local to remote', records.length);

      if (records.length) {
        // 把records发给远端，让远端执行并同步
        await this.push(records);
        return;
      }

      // 不匹配的数据，把本地文件同步到远端
      await endpointService.replace();
      return;
    }
  };
  recv = (records: SQLHistory[]) => {
    logger.i('recv', records.length);
    return this.run(SyncState.Recving, async () => {
      for(let i = 0; i < records.length; i += 1) {
        const { sql, params, checksum } = records[i];
        this.db.prepare(sql).run(JSON.parse(params));
        const resultsum = dbhash();
        if (resultsum !== checksum) {
          logger.e(`同步失败, hash不一致, expect: ${checksum}, received: ${resultsum}`);
          return false;
        }
        await prisma.sQLHistory.create({
          data: records[i]
        });
      }
      await prisma.sQLHistory.deleteMany({
        where: {
          id: {
            lte: Math.max(...records.map(item => item.id))
          }
        }
      });
      return true;
    });
  };

  replace = async (file: File) => {
    logger.w('replace');
    return this.run(SyncState.Replacing, async () => {
      const dbName = new Date().toISOString() + '.db';
      await this.db.backup(path.join(backupPath, dbName));
      adapter.disconnect();
      this.db.close();
      await prisma.$disconnect();
      copyFileSync(file.filepath, dbPath);
      adapter.connect();
      await prisma.$connect();
      this.db = new Database(dbPath);
    });
  };
  // 把本地的records推到远程，让远程进行同步
  push = async (records: {
    id: number,
    createdAt: string | Date,
    updatedAt: string | Date,
    sql: string,
    params: string,
    checksum: string
  }[]) => {
    const { data } = await request.post(ENDPOINT, { type: 'push', records });
    if (data.success) {
      // 远程执行成功，删除此记录及之前的记录
      await prisma.sQLHistory.deleteMany({
        where: {
          id: {
            lte: Math.max(...records.map(item => item.id))
          }
        }
      });
      return;
    }
    if (!data.success) {
      // 远程执行SQL失败了，把整个文件推上去
      await endpointService.replace();
    }
  };
  query = (event: { sql: string, args: any[] }) => {
    if (!ENDPOINT) return;

    const checksum = dbhash();
    return prisma.sQLHistory
      .create({ data: { sql: event.sql, params: JSON.stringify(event.args), checksum } })
      .then((record) => {
        this.push([record]);
      });
  };
  private getRecordsBetween = async (
    from: Omit<SQLHistory, 'params' | 'sql'>,
    to: Omit<SQLHistory, 'params' | 'sql'>
  ) => {
    const records = await prisma.sQLHistory.findMany({
      where: {
        createdAt: {
          lte: to.createdAt,
          gte: from.createdAt
        }
      }
    });
    logger.i('recordsBetween', records.length);
    if (records[0]?.checksum !== from.checksum || records[records.length - 1]?.checksum !== to.checksum) {
      // 不匹配的checksum，返回空数组
      return [];
    }
    return records.slice(1).map(item => {
      return {
        ...item,
        createdAt: item.createdAt.toISOString(),
        updatedAt: item.createdAt.toISOString()
      };
    });
  };
  private checkState = () => {
    if (this.state !== SyncState.Idle) {
      throw new Error('cant run when state is ' + this.state);
    }
  };
  private run = async <T>(state: SyncState, exec: () => Promise<T> | T) => {
    this.checkState();
    this.state = state;
    try {
      const result = await exec();
      this.state = SyncState.Idle;
      return result;
    } catch (err) {
      this.state = SyncState.Idle;
      throw err;
    }
  };
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

export const endpointService = new EndpointService();
export const localService = new LocalService();
export const syncTaskService = new SyncTaskService();