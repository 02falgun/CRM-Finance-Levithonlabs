import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

/**
 * Thin, resilient Redis cache wrapper. If Redis is unreachable the service
 * silently degrades to a no-op (every get returns null, sets/dels are skipped)
 * so the API keeps working without a cache.
 */
@Injectable()
export class CacheService implements OnModuleDestroy {
  private readonly logger = new Logger('CacheService');
  private client: Redis | null = null;
  private healthy = false;

  constructor(private readonly config: ConfigService) {
    const url = this.config.get<string>('REDIS_URL') || 'redis://localhost:6379';
    try {
      this.client = new Redis(url, {
        lazyConnect: false,
        maxRetriesPerRequest: 1,
        enableOfflineQueue: false,
        // Keep retrying with capped backoff so the cache auto-recovers if Redis
        // starts after the API (never give up permanently).
        retryStrategy: (times) => Math.min(times * 300, 3000),
      });

      this.client.on('ready', () => {
        this.healthy = true;
        this.logger.log('Redis cache connected');
      });
      this.client.on('error', (err) => {
        if (this.healthy) this.logger.warn(`Redis cache error: ${err.message}`);
        this.healthy = false;
      });
      this.client.on('end', () => {
        this.healthy = false;
      });
    } catch (e: any) {
      this.logger.warn(`Redis init failed, cache disabled: ${e?.message}`);
      this.client = null;
    }
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.client || !this.healthy) return null;
    try {
      const raw = await this.client.get(key);
      return raw ? (JSON.parse(raw) as T) : null;
    } catch {
      return null;
    }
  }

  async set(key: string, value: unknown, ttlSeconds: number): Promise<void> {
    if (!this.client || !this.healthy) return;
    try {
      await this.client.set(key, JSON.stringify(value), 'EX', ttlSeconds);
    } catch {
      // ignore cache write failures
    }
  }

  async del(...keys: string[]): Promise<void> {
    if (!this.client || !this.healthy || keys.length === 0) return;
    try {
      await this.client.del(...keys);
    } catch {
      // ignore
    }
  }

  /**
   * Cache-aside helper: return cached value or compute, store, and return it.
   */
  async wrap<T>(key: string, ttlSeconds: number, producer: () => Promise<T>): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) return cached;
    const fresh = await producer();
    await this.set(key, fresh, ttlSeconds);
    return fresh;
  }

  onModuleDestroy() {
    this.client?.quit().catch(() => undefined);
  }
}
