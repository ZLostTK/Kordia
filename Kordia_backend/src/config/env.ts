import { config as dotenv } from 'dotenv';
import { statSync, mkdirSync } from 'fs';
import { resolve } from 'path';

dotenv();

function str(key: string, def: string): string {
  return process.env[key] ?? def;
}

function bool(key: string, def: boolean): boolean {
  const v = process.env[key];
  return v === undefined ? def : v.toLowerCase() === 'true';
}

function int(key: string, def: number): number {
  const v = process.env[key];
  return v === undefined ? def : parseInt(v, 10);
}

function csv(key: string, def: string): string[] {
  const v = process.env[key] ?? def;
  if (v === '*') return ['*'];
  return v.split(',').map(s => s.trim());
}

function ensureDir(p: string): void {
  try { statSync(p); } catch { mkdirSync(p, { recursive: true }); }
}

class Config {
  readonly appName = str('APP_NAME', 'Kordia API');
  readonly appVersion = str('APP_VERSION', '2.0.0');
  readonly debug = bool('DEBUG', false);
  readonly host = str('HOST', '0.0.0.0');
  readonly port = int('PORT', 8000);
  readonly corsOrigins = csv('CORS_ORIGINS', '*');
  readonly dataDir = resolve(str('DATA_DIR', './Kordia_data'));
  readonly staticDir = resolve('./dist');

  readonly cacheTtl = int('CACHE_TTL', 5400);
  readonly cacheMaxSize = int('CACHE_MAX_SIZE', 500);
  readonly cacheCleanupDays = int('CACHE_CLEANUP_DAYS', 30);

  readonly ytdlpQuiet = bool('YTDLP_QUIET', true);
  readonly ytdlpNoWarnings = bool('YTDLP_NO_WARNINGS', true);

  readonly audioFormat = str('AUDIO_FORMAT', 'm4a');
  readonly audioCodec = str('AUDIO_CODEC', 'm4a');

  get audioDir(): string { return `${this.dataDir}/audio`; }
  get artworkDir(): string { return `${this.dataDir}/artwork`; }
  get dbPath(): string { return `${this.dataDir}/Kordia.db`; }

  createDirectories(): void {
    ensureDir(this.dataDir);
    ensureDir(this.audioDir);
    ensureDir(this.artworkDir);
  }
}

export const config = new Config();
