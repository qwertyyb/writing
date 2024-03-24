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

export class SqliteAdapter implements DriverAdapter, Transaction {
  readonly provider: 'mysql' | 'postgres' | 'sqlite' = 'sqlite';
  readonly db: SQLite.Database;
  options: TransactionOptions = {
    usePhantomQuery: true
  };
  constructor(filename: string, options?: SQLite.Options) {
    this.db = new SQLite(filename, options);
  }

  commit(): Promise<Result<void>> {
    try {
      this.db.prepare('COMMIT').run();
      return Promise.resolve(ok(undefined));
    } catch (err) {
      console.error(err);
      return Promise.resolve(err(err));
    }
  }
  rollback(): Promise<Result<void>> {
    try {
      this.db.prepare('ROLLBACK').run();
      return Promise.resolve(ok(undefined));
    } catch (err) {
      console.error(err);
      return Promise.resolve(err(err));
    }
  }

  startTransaction(): Promise<Result<Transaction>> {
    try {
      this.db.prepare('BEGIN').run();
      return Promise.resolve(ok(this));
    } catch (error) {
      console.error(error);
      return Promise.resolve(err(error));
    }
  }

  private async exec<T>(callback: () => Promise<T> | T): Promise<Result<T>> {
    try {
      return ok(await callback());
    } catch (error) {
      return err(error);
    }
  }

  queryRaw(params: Query): Promise<Result<ResultSet>> {
    console.log('queryRaw', params);
    return this.exec(() => {
      const formatArgs = params.args.map(item => {
        if (typeof item === 'boolean') {
          return +item;
        }
        return item;
      });
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
  }
  executeRaw(params: Query): Promise<Result<number>> {
    return this.exec(() => {
      const formatArgs = params.args.map(item => {
        if (typeof item === 'boolean') {
          return +item;
        }
        return item;
      });
      const result = this.db.prepare(params.sql).run(formatArgs);
      return result.changes;
    });
  }
}