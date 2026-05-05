import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class InMemoryCacheService {
  private readonly logger = new Logger(InMemoryCacheService.name);
  private cache = new Map<string, any>();
  private expiries = new Map<string, number>();

  constructor() {
    // Cleanup interval every 1 minute
    setInterval(() => this.cleanup(), 60000);
  }

  async set(key: string, value: any, ttlSeconds?: number): Promise<void> {
    this.cache.set(key, value);
    if (ttlSeconds) {
      this.expiries.set(key, Date.now() + ttlSeconds * 1000);
    } else {
      this.expiries.delete(key);
    }
  }

  async get<T = any>(key: string): Promise<T | null> {
    if (this.isExpired(key)) {
      this.del(key);
      return null;
    }
    return this.cache.get(key) ?? null;
  }

  async del(key: string): Promise<void> {
    this.cache.delete(key);
    this.expiries.delete(key);
  }

  async has(key: string): Promise<boolean> {
    if (this.isExpired(key)) {
      this.del(key);
      return false;
    }
    return this.cache.has(key);
  }

  async keys(pattern: string): Promise<string[]> {
    const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
    const result: string[] = [];
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        if (!this.isExpired(key)) {
          result.push(key);
        } else {
          this.del(key);
        }
      }
    }
    return result;
  }

  // Redis-like methods for compatibility
  async hset(key: string, field: string, value: any): Promise<void> {
    let obj = this.cache.get(key) || {};
    if (typeof obj !== 'object') obj = {};
    obj[field] = value;
    this.cache.set(key, obj);
  }

  async hget(key: string, field: string): Promise<any> {
    const obj = await this.get(key);
    return obj ? obj[field] : null;
  }

  async hgetall(key: string): Promise<Record<string, any> | null> {
    return this.get(key);
  }

  async hdel(key: string, field: string): Promise<void> {
    const obj = await this.get(key);
    if (obj) {
      delete obj[field];
      this.cache.set(key, obj);
    }
  }

  private isExpired(key: string): boolean {
    const expiry = this.expiries.get(key);
    if (!expiry) return false;
    return Date.now() > expiry;
  }

  private cleanup() {
    const now = Date.now();
    for (const [key, expiry] of this.expiries.entries()) {
      if (now > expiry) {
        this.cache.delete(key);
        this.expiries.delete(key);
      }
    }
  }
}
