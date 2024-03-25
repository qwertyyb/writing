import axios from 'axios';
import { prisma } from '../prisma';
import { SQLHistory } from '@prisma/client';
import Database from 'better-sqlite3';
import { dbPath } from '../const';
import { dbhash } from '../utils';
import { openAsBlob } from 'fs';

enum SyncState {
  Idle = 0,
  Sending = 1,
  Recving = 2
}

export class SyncService {
  endPoint: string;
  state: SyncState = SyncState.Idle;
  db: Database.Database;

  constructor() {
    this.db = new Database(dbPath);
  }

  getLatest = () => {
    return prisma.sQLHistory.findFirst({
      orderBy: { createdAt: 'desc' },
      select: { id: true, createdAt: true, updatedAt: true, sql: true, checksum: true }
    });
  };

  check = async () => {
    this.checkState();
    const latest = await this.getLatest();
    const lastOperateTime = latest?.createdAt.getTime() ?? 0;
    // 检查远端最新记录
    // @todo 鉴权
    const response = await axios.get(this.endPoint);
    const { data: remoteRecord } = response.data;
    const { createdAt: remoteLatestCreatedAt } = remoteRecord;
    if (remoteLatestCreatedAt > lastOperateTime) {
      // 远端最后操作时间比本地最后时间大，则说明远端比较新
      // 把本地的最新记录和远端记录发给远端，获取这之间的所有变更
      const records = []; // getRecordsBetween()

      // 如果records为空，则说明，本地的最新记录不在远端的记录历史中，也就是说本地和远端有了两个分支
      // 这种情况，需要首先把远端文件备份，然后把本地整个文件同步给远端
      if (records.length) {
        // 备份远端文件，并把整个文件传给远端
        await this.backupRemote();
        await this.sendFileToRemote();
        return;
      }
      this.recv(records);
    } else if (remoteLatestCreatedAt < lastOperateTime) {
      // 本地最后操作时间比远端最后操作时间大，说明本地比较新
      // 把本地的 records 传给远端,让远端进行同步
      const records = await this.getRecordsBetween(remoteRecord, latest);

      if (records.length) {
        // 把records发给远端，让远端执行并同步
        this.send(records);
        return;
      }

      // 不匹配的数据，备份远端数据，然后把本地文件同步到远端
      await this.backupRemote();
      await this.sendFileToRemote();
    }
  };
  send = async (records: SQLHistory[]) => {
    this.checkState();
    await axios.post(this.endPoint, {
      type: 'send',
      records
    });
  };
  recv = (records: SQLHistory[]) => {
    this.checkState();
    for(let i = 0; i < records.length; i += 1) {
      const { sql, params, checksum } = records[i];
      this.db.prepare(sql).run(JSON.stringify(params));
      const resultsum = dbhash();
      if (resultsum !== checksum) {
        throw new Error(`同步失败, hash不一致, expect: ${checksum}, received: ${resultsum}`);
      }
      this.db.prepare('INSERT INTO SQLHistory(id, createdAt, updatedAt, sql, params, checksum) VALUES(:id, :createdAt, :updatedAt, :sql, :params, :checksum)')
        .run(records[i]);
    }
  };
  
  private backupRemote = () => {
    return axios.post(this.endPoint, {
      type: 'backup',
    });
  };
  private sendFileToRemote = async () => {
    const formData = new FormData();
    formData.append('type', 'file');
    formData.append('file', await openAsBlob(dbPath));
    return axios.post(this.endPoint, formData);
  };
  private getRecordsBetween = async (
    from: Omit<SQLHistory, 'params' | 'comment'>,
    to: Omit<SQLHistory, 'params' | 'comment'>
  ) => {
    const records = await prisma.sQLHistory.findMany({
      where: {
        createdAt: {
          lte: from.createdAt,
          gte: to.createdAt
        }
      }
    });
    if (records[0]?.checksum !== from.checksum || records[records.length - 1]?.checksum !== to.checksum) {
      // 不匹配的checksum，返回空数组
      return [];
    }
    return records;
  };
  private checkState = () => {
    if (this.state !== SyncState.Idle) {
      throw new Error('cant check when state is ' + this.state);
    }
  };
}