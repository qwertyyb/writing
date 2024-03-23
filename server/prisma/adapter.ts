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

const sqliteTypeToColumnType = (type: SQLiteType | null, value: number | string | Buffer | null): ColumnType => {
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
  return valueToColumnType(value);
};

const valueToColumnType = (value: number | string | Buffer | null) => {
  if (value === null) return ColumnTypeEnum.Text;
  if (typeof value === 'number') return ColumnTypeEnum.Numeric;
  if (typeof value === 'string') return ColumnTypeEnum.Text;
  if (value instanceof Buffer) return ColumnTypeEnum.Bytes;
  return ColumnTypeEnum.Text;
};

export class SqliteAdapter implements DriverAdapter, Transaction {
  readonly provider: 'mysql' | 'postgres' | 'sqlite' = 'sqlite';
  readonly db: SQLite.Database;
  options: TransactionOptions;
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
    } catch (err) {
      console.error(err);
      return Promise.resolve(err(err));
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
      return {
        columnNames: columns.map(item => item.name),
        columnTypes,
        rows: results
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