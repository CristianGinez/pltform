import { Inject, Injectable, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';
import { REDIS_CLIENT } from './redis.constants';

@Injectable()
export class RedisService implements OnModuleDestroy {
  constructor(@Inject(REDIS_CLIENT) private readonly client: Redis) {}

  // ─── Raw client access (for advanced use: pub/sub, adapters) ────────

  getClient(): Redis {
    return this.client;
  }

  // ─── Cache operations ───────────────────────────────────────────────

  /**
   * Get a cached value. Returns null if key doesn't exist or is expired.
   */
  async get<T>(key: string): Promise<T | null> {
    const raw = await this.client.get(key);
    if (raw === null) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  }

  /**
   * Set a value in cache with a TTL in seconds.
   * Default TTL: 60 seconds.
   */
  async set(key: string, value: unknown, ttlSeconds = 60): Promise<void> {
    await this.client.set(key, JSON.stringify(value), 'EX', ttlSeconds);
  }

  /**
   * Delete a specific key.
   */
  async del(key: string): Promise<void> {
    await this.client.del(key);
  }

  /**
   * Delete all keys matching a pattern.
   * Useful for invalidating all cached pages of a listing.
   *
   * Example: invalidate('projects:*') deletes all project listing caches.
   *
   * IMPORTANT: Uses SCAN internally, not KEYS, so it's safe for production.
   */
  async invalidate(pattern: string): Promise<void> {
    let cursor = '0';
    do {
      const [nextCursor, keys] = await this.client.scan(
        cursor,
        'MATCH',
        pattern,
        'COUNT',
        100,
      );
      cursor = nextCursor;
      if (keys.length > 0) {
        await this.client.del(...keys);
      }
    } while (cursor !== '0');
  }

  // ─── Lifecycle ──────────────────────────────────────────────────────

  async onModuleDestroy() {
    await this.client.quit();
  }
}
