import { Injectable, Logger } from '@nestjs/common';
import { LockResult } from '../interfaces/lock-result.interface';
import { InMemoryCacheService } from '../../../services/common/in-memory-cache.service';

@Injectable()
export class LockService {
  private readonly logger = new Logger(LockService.name);
  private lockIntervals = new Map<string, ReturnType<typeof setInterval>>();
  private lockQueue = new Map<string, (() => void)[]>();

  constructor(private readonly cache: InMemoryCacheService) {}

  private getLockKey(projectId: string, targetId: string) {
    return `lock:${projectId}:${targetId}`;
  }

  async acquireLock(
    projectId: string,
    targetId: string,
    userId: string,
    ttl = 30,
    retry = 5,
    retryDelay = 100,
  ): Promise<any> {
    const lockKey = this.getLockKey(projectId, targetId);
    for (let i = 0; i < retry; i++) {
      const isLocked = await this.cache.has(lockKey);
      if (!isLocked) {
        await this.cache.set(lockKey, userId, ttl);
        this.logger.debug(`[LOCK] Acquired ${lockKey} by ${userId}`);
        this.autoRefreshLock(lockKey, userId, ttl);
        return { status: 'success' };
      }
      
      const owner = await this.cache.get(lockKey);
      if (owner === userId) {
        // Re-entrant lock
        await this.cache.set(lockKey, userId, ttl);
        return { status: 'success' };
      }

      await new Promise((r) => setTimeout(r, retryDelay));
    }
    const lockedBy = await this.cache.get(lockKey);
    return { status: 'error', message: 'lock', lockedBy };
  }

  private autoRefreshLock(lockKey: string, userId: string, ttl: number) {
    const intervalKey = `${lockKey}:${userId}`;
    if (this.lockIntervals.has(intervalKey))
      clearInterval(this.lockIntervals.get(intervalKey)!);

    const interval = setInterval(async () => {
      try {
        const owner = await this.cache.get(lockKey);
        if (owner === userId) {
          await this.cache.set(lockKey, userId, ttl);
        } else {
          clearInterval(interval);
          this.lockIntervals.delete(intervalKey);
          this.logger.debug(
            `[LOCK] Auto-refresh stopped for ${lockKey} by ${userId}`,
          );
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
        const owner = await this.cache.get(lockKey);
        if (owner === userId) await this.cache.del(lockKey);
      } else {
        await this.cache.del(lockKey);
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
    const keys = await this.cache.keys('lock:*');
    for (const key of keys) {
      const owner = await this.cache.get(key);
      if (owner === userId) {
        const parts = key.split(':');
        if (parts.length >= 3) {
          const projectId = parts[1];
          const targetId = parts[2];
          await this.releaseLock(projectId, targetId, userId);
        }
      }
    }
  }
  async emitWithLock(
    projectId: string,
    targetId: string,
    userId: string,
    callback: () => Promise<any>, // callback trả Promise
    ttl = 30,
  ): Promise<LockResult> {
    return new Promise((resolve) => {
      const tryAcquire = async () => {
        const lock = await this.acquireLock(projectId, targetId, userId, ttl);
        if (lock.status === 'success') {
          try {
            const result = await callback();
            resolve(result);
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
