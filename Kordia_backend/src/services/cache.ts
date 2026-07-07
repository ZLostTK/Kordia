import { config } from '../config/env.js';
import type { StreamCacheRepository } from '../database/stream-cache.js';

export class CacheService {
  private memory = new Map<string, { url: string; expires: number }>();

  getStreamUrl(ytid: string, db?: StreamCacheRepository): string | undefined {
    const entry = this.memory.get(ytid);
    if (entry && entry.expires > Date.now()) return entry.url;

    if (db) {
      const url = db.getCachedUrl(ytid);
      if (url) {
        this.memory.set(ytid, { url, expires: Date.now() + config.cacheTtl * 1000 });
        return url;
      }
    }
    return undefined;
  }

  saveStreamUrl(ytid: string, url: string, db?: StreamCacheRepository): void {
    // LRU eviction: delete oldest entry if at capacity
    if (this.memory.size >= config.cacheMaxSize && !this.memory.has(ytid)) {
      const oldest = this.memory.keys().next().value;
      if (oldest) this.memory.delete(oldest);
    }
    this.memory.set(ytid, { url, expires: Date.now() + config.cacheTtl * 1000 });
    if (db) db.saveUrl(ytid, url);
  }

  clearMemoryCache(): void {
    this.memory.clear();
  }

  getCacheStats(): { memorySize: number; memoryMaxsize: number; ttl: number } {
    return {
      memorySize: this.memory.size,
      memoryMaxsize: config.cacheMaxSize,
      ttl: config.cacheTtl,
    };
  }
}
