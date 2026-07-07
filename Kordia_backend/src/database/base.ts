import type Database from 'better-sqlite3';

export class BaseRepository {
  constructor(protected db: Database.Database) {}

  protected execute(sql: string, params: unknown[] = []): Database.RunResult {
    return this.db.prepare(sql).run(...params);
  }

  protected fetchOne<T = Record<string, unknown>>(sql: string, params: unknown[] = []): T | undefined {
    return this.db.prepare(sql).get(...params) as T | undefined;
  }

  protected fetchAll<T = Record<string, unknown>>(sql: string, params: unknown[] = []): T[] {
    return this.db.prepare(sql).all(...params) as T[];
  }
}
