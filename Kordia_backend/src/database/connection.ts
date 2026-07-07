import Database from 'better-sqlite3';
import { config } from '../config/env.js';
import { SCHEMAS, INDEXES } from './schema.js';

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(config.dbPath);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    initSchema();
  }
  return db;
}

function initSchema(): void {
  for (const sql of SCHEMAS) db!.exec(sql);
  for (const sql of INDEXES) db!.exec(sql);
}

export function closeDb(): void {
  if (db) { db.close(); db = null; }
}
