import { DatabaseSync } from 'node:sqlite';
import { config } from '../config/env.js';
import { SCHEMAS, INDEXES } from './schema.js';

let db: DatabaseSync | null = null;

function getDbRaw(): DatabaseSync {
  if (!db) {
    db = new DatabaseSync(config.dbPath);
    db.exec('PRAGMA journal_mode = WAL');
    db.exec('PRAGMA foreign_keys = ON');
    for (const sql of SCHEMAS) db.exec(sql);
    for (const sql of INDEXES) db.exec(sql);
  }
  return db;
}

export function getDb(): DatabaseSync {
  return getDbRaw();
}

export function closeDb(): void {
  if (db) { db.close(); db = null; }
}
