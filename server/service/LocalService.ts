import Database from 'better-sqlite3';
import { backupPath, dbPath } from '../const';
import { createLogger } from '../utils/logger';
import { endpointService } from './EndpointService';
import { QueryEvent, QueryEventJSON } from './sync';
import { dbhash } from '../utils';
import path from 'node:path';
import { adapter } from '../prisma/adapter';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { prisma } from '../prisma';
import { SyncStorage, syncStorage } from './SyncStorage';

const logger = createLogger('LocalService');

enum SyncState {
  Idle = 0,
  Recving = 2,
  Replacing = 4
}

export class LocalService {
  state: SyncState = SyncState.Idle;
  db: Database.Database;

  constructor() {
    this.db = new Database(dbPath);
    if (!existsSync(backupPath)) {
      mkdirSync(backupPath, { recursive: true });
    }
  }

  getLatest = (): Omit<QueryEvent, 'args'> => {
    const records = syncStorage.getData();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { args, ...rest } = records[records.length - 1];
    return {
      ...rest,
      time: new Date(rest.time)
    };
  };

  check = async () => {
    logger.i('check start');
    this.checkState();
    const latest = this.getLatest();
    const lastOperateTime = latest?.time.getTime() ?? 0;
    // 检查远端最新记录
    const remoteRecord = await endpointService.getLatest();
    logger.i('local and remote: ', latest, remoteRecord);

    if (remoteRecord.time.getTime() > lastOperateTime) {
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
    if (remoteRecord.time.getTime() < lastOperateTime) {
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
  recv = (records: QueryEventJSON[]) => {
    logger.i('recv', records.length);
    return this.run(SyncState.Recving, async () => {
      for(let i = 0; i < records.length; i += 1) {
        const { sql, args, hash } = records[i];
        this.db.prepare(sql).run(SyncStorage.parseArgs(args));
        const resultHash = dbhash();
        if (resultHash !== hash) {
          logger.e(`同步失败, hash不一致, expect: ${hash}, received: ${resultHash}`);
          return false;
        }
      }
      return true;
    });
  };

  replace = async (file: Buffer) => {
    logger.w('replace');
    return this.run(SyncState.Replacing, async () => {
      try {
        const dbName = new Date().toISOString() + '.db';
        await this.db.backup(path.join(backupPath, dbName));
        adapter.disconnect();
        this.db.close();
        await prisma.$disconnect();
        writeFileSync(dbPath, file);
        adapter.connect();
        await prisma.$connect();
        this.db = new Database(dbPath);
        return true;
      } catch (err) {
        logger.e('replace error', err);
        return false;
      }
    });
  };
  // 把本地的records推到远程，让远程进行同步
  push = async (records: QueryEventJSON[]) => {
    const data = await endpointService.query(records);
    if (data.success) {
      return;
    }
    // 远程执行SQL失败了，把整个文件推上去
    await endpointService.replace();
  };
  private getRecordsBetween = async (
    from: Omit<QueryEvent, 'args'>,
    to: Omit<QueryEvent, 'args'>
  ) => {
    const records = syncStorage.getData()
      .filter(item => {
        const time = new Date(item.time).getTime();
        return time >= from.time.getTime() && time <= to.time.getTime();
      });
    logger.i('recordsBetween', records.length);
    if (records[0]?.hash !== from.hash || records[records.length - 1]?.hash !== to.hash) {
      // 不匹配的checksum，返回空数组
      return [];
    }
    return records.slice(1);
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

export const localService = new LocalService();
