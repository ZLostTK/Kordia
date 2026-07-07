import { BaseRepository } from './base.js';
import { config } from '../config/env.js';

interface CacheRow { ytid: string; url: string; timestamp: string; }

export class StreamCacheRepository extends BaseRepository {
  getCachedUrl(ytid: string, ttlSeconds = config.cacheTtl): string | undefined {
    const row = this.fetchOne<CacheRow>(
      'SELECT url, timestamp FROM stream_cache WHERE ytid = ?',
      [ytid]
    );
    if (!row) return undefined;
    const age = (Date.now() - new Date(row.timestamp).getTime()) / 1000;
    return age < ttlSeconds ? row.url : undefined;
  }

  saveUrl(ytid: string, url: string): void {
    this.execute(
      'INSERT OR REPLACE INTO stream_cache (ytid, url, timestamp) VALUES (?, ?, ?)',
      [ytid, url, new Date().toISOString()]
    );
  }

  deleteOldEntries(days: number): number {
    const cutoff = new Date(Date.now() - days * 86400000).toISOString();
    const result = this.execute('DELETE FROM stream_cache WHERE timestamp < ?', [cutoff]);
    return Number(result.changes);
  }

  clearCache(): void {
    this.execute('DELETE FROM stream_cache');
  }
}
