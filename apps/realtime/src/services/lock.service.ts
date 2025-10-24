import Redis from 'ioredis';
import { Logger } from '@nestjs/common';
import { LockResult } from '../interfaces/lock-result.interface';

export class LockService {
  private readonly logger = new Logger(LockService.name);
  private lockIntervals = new Map<string, NodeJS.Timeout>();
  private lockQueue = new Map<string, (() => void)[]>();

  constructor(private readonly redis: Redis) {}

  private getLockKey(projectId: string, targetId: string) {
    return `lock:${projectId}:${targetId}`;
  }

  private luaRefreshLock = `
    if redis.call("get", KEYS[1]) == ARGV[1] then
      return redis.call("expire", KEYS[1], ARGV[2])
    else
      return 0
    end
  `;

  async acquireLock(
    projectId: string,
    targetId: string,
    userId: string,
    ttl = 30,
    retry = 5,
    retryDelay = 100
  ): Promise<LockResult> {
    const lockKey = this.getLockKey(projectId, targetId);
    for (let i = 0; i < retry; i++) {
      const res = await this.redis.set(lockKey, userId, { NX: true, EX: ttl } as any);
      if (res === 'OK') {
        this.logger.debug(`[LOCK] Acquired ${lockKey} by ${userId}`);
        this.autoRefreshLock(lockKey, userId, ttl);
        return { status: 'success' };
      }
      await new Promise(r => setTimeout(r, retryDelay));
    }
    const lockedBy = await this.redis.get(lockKey);
    return { status: 'error', message: `Locked by another user (${lockedBy})` };
  }

  private autoRefreshLock(lockKey: string, userId: string, ttl: number) {
    const intervalKey = `${lockKey}:${userId}`;
    if (this.lockIntervals.has(intervalKey)) clearInterval(this.lockIntervals.get(intervalKey)!);

    const interval = setInterval(async () => {
      try {
        const refreshed = await this.redis.eval(this.luaRefreshLock, 1, lockKey, userId, ttl);
        if (refreshed === 0) {
          clearInterval(interval);
          this.lockIntervals.delete(intervalKey);
          this.logger.debug(`[LOCK] Auto-refresh stopped for ${lockKey} by ${userId}`);
        }
      } catch (err) {
        clearInterval(interval);
        this.lockIntervals.delete(intervalKey);
        this.logger.error(`[LOCK] Error refreshing ${lockKey}`, err);
      }
    }, (ttl * 1000) / 2);

    this.lockIntervals.set(intervalKey, interval);
  }

  async releaseLock(projectId: string, targetId: string, userId?: string) {
    const lockKey = this.getLockKey(projectId, targetId);
    const intervalKey = `${lockKey}:${userId}`;
    const interval = this.lockIntervals.get(intervalKey);
    if (interval) {
      clearInterval(interval);
      this.lockIntervals.delete(intervalKey);
    }

    try {
      if (userId) {
        const owner = await this.redis.get(lockKey);
        if (owner === userId) await this.redis.del(lockKey);
      } else {
        await this.redis.del(lockKey);
      }
      this.logger.debug(`[LOCK] Released ${lockKey} by ${userId || 'anyone'}`);
    } catch (err) {
      this.logger.error(`[LOCK] Error releasing ${lockKey}`, err);
    }

    const queue = this.lockQueue.get(lockKey);
    if (queue && queue.length > 0) {
      const next = queue.shift();
      next?.();
    }
  }

  async releaseAllLocksForUser(userId: string) {
    let cursor = '0';
    do {
      const [nextCursor, keys] = await this.redis.scan(cursor, 'MATCH', 'lock:*', 'COUNT', 100);
      cursor = nextCursor;
      for (const key of keys) {
        const owner = await this.redis.get(key);
        if (owner === userId) {
          const [_, projectId, targetId] = key.split(':');
          await this.releaseLock(projectId, targetId, userId);
        }
      }
    } while (cursor !== '0');
  }

  async emitWithLock(
    projectId: string,
    targetId: string,
    userId: string,
    callback: () => void,
    ttl = 30
  ): Promise<LockResult> {
    return new Promise(resolve => {
      const tryAcquire = async () => {
        const lock = await this.acquireLock(projectId, targetId, userId, ttl);
        if (lock.status === 'success') {
          try {
            callback();
            resolve({ status: 'success' });
          } finally {
            await this.releaseLock(projectId, targetId, userId);
          }
        } else {
          const lockKey = this.getLockKey(projectId, targetId);
          if (!this.lockQueue.has(lockKey)) this.lockQueue.set(lockKey, []);
          this.lockQueue.get(lockKey)!.push(tryAcquire);
        }
      };
      tryAcquire();
    });
  }
}
