import type {
  DriverAdapter,
  Query,
  Result,
  ResultSet,
  Transaction,
  TransactionOptions,
  ColumnType,
} from '@prisma/driver-adapter-utils';
import { err, ok, ColumnTypeEnum } from '@prisma/driver-adapter-utils';
import SQLite from 'better-sqlite3';
import { EventEmitter } from 'node:events';
import { createLogger } from '../utils/logger';

const logger = createLogger('adapter');

type SQLiteType = 'REAL' | 'INTEGER' | 'BOOLEAN' | 'DECIMAL' | 'NUMERIC' | 'TEXT' | 'BLOB' | 'DATETIME' | 'NULL'
type SQLiteValue = number | string | number[] | null

// 根据值反推类型
const valueToColumnType = (value: SQLiteValue) => {
  if (value === null) return ColumnTypeEnum.Text;
  if (typeof value === 'number') return ColumnTypeEnum.Numeric;
  if (typeof value === 'string') return ColumnTypeEnum.Text;
  if (value instanceof Buffer) return ColumnTypeEnum.Bytes;
  return ColumnTypeEnum.Text;
};

const sqliteTypeToColumnType = (type: SQLiteType | null, value: SQLiteValue): ColumnType => {
  const typeMap = {
    'REAL': ColumnTypeEnum.Float,
    'INTEGER': ColumnTypeEnum.Int32,
    'BOOLEAN': ColumnTypeEnum.Boolean,
    'DECIMAL': ColumnTypeEnum.Float,
    'NUMERIC': ColumnTypeEnum.Numeric,
    'TEXT': ColumnTypeEnum.Text,
    'BLOB': ColumnTypeEnum.Bytes,
    'DATETIME': ColumnTypeEnum.DateTime,
  };
  if (Object.keys(typeMap).includes(type)) {
    return typeMap[type];
  }
  // 若类型不支持，根据值反推类型
  return valueToColumnType(value);
};

const convertValue = (type: SQLiteType | null, value: SQLiteValue): SQLiteValue => {
  // 对 timestamp 时间戳做一层转换
  if (type === 'DATETIME' && typeof value === 'number') return new Date(value).toISOString();
  // Uint8Array 转换为普通数组
  if (type === 'BLOB' && value instanceof Uint8Array) return Array.from(value);
  return value;
};

const convertArg = (arg: number | boolean | string | null) => {
  if (typeof arg === 'boolean') return +arg;
  return arg;
};

export class SqliteAdapter extends EventEmitter implements DriverAdapter, Transaction {
  readonly provider: 'mysql' | 'postgres' | 'sqlite' = 'sqlite';
  readonly db: SQLite.Database;
  options: TransactionOptions = {
    usePhantomQuery: false
  };
  constructor(filename: string, options?: SQLite.Options) {
    super();
    this.db = new SQLite(filename, options);
  }

  commit(): Promise<Result<void>> {
    logger.i('driver commit');
    return Promise.resolve(ok(undefined));
  }
  rollback(): Promise<Result<void>> {
    logger.i('driver rollback');
    return Promise.resolve(ok(undefined));
  }

  startTransaction(): Promise<Result<Transaction>> {
    logger.i('driver startTransaction');
    return Promise.resolve(ok(this));
  }

  private async tryExec<T>(callback: () => Promise<T> | T): Promise<Result<T>> {
    try {
      return ok(await callback());
    } catch (error) {
      return err(error);
    }
  }

  async queryRaw(params: Query): Promise<Result<ResultSet>> {
    const result = await this.tryExec(() => {
      const formatArgs = params.args.map(convertArg);
      const stm = this.db.prepare(params.sql).bind(formatArgs);
      const results = stm.raw().all() as any[][];
      const columns = stm.columns();
      const first = results[0] || {};
      const columnTypes = columns.map((item, index) => {
        return sqliteTypeToColumnType(item.type as SQLiteType, first[index]);
      });
      const rows = results.map(item => {
        return item.map((field, index) => {
          return convertValue(columns[index].type as SQLiteType, field);
        });
      });
      return {
        columnNames: columns.map(item => item.name),
        columnTypes,
        rows
      };
    });
    Promise.resolve().then(() => {
      this.emit('query', { ...params, success: result.ok });
    });
    return result;
  }

  async executeRaw(params: Query): Promise<Result<number>> {
    const result = await this.tryExec(() => {
      const formatArgs = params.args.map(convertArg);
      const result = this.db.prepare(params.sql).run(formatArgs);
      return result.changes;
    });
    Promise.resolve().then(() => {
      this.emit('query', { ...params, success: result.ok });
    });
    return result;
  }
}