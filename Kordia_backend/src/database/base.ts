import type { DatabaseSync } from 'node:sqlite';

type SQLParam = string | number | null | bigint;

export class BaseRepository {
  constructor(protected db: DatabaseSync) {}

  protected execute(sql: string, params: SQLParam[] = []) {
    return this.db.prepare(sql).run(...params);
  }

  protected fetchOne<T = Record<string, unknown>>(sql: string, params: SQLParam[] = []): T | undefined {
    return this.db.prepare(sql).get(...params) as T | undefined;
  }

  protected fetchAll<T = Record<string, unknown>>(sql: string, params: SQLParam[] = []): T[] {
    return this.db.prepare(sql).all(...params) as T[];
  }
}
