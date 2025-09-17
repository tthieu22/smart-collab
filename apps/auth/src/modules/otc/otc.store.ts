import { Injectable } from '@nestjs/common';
import { InjectRedis } from '@nestjs-modules/ioredis';
import { Redis } from 'ioredis';

@Injectable()
export class OtcService {
  constructor(@InjectRedis() private readonly redis: Redis) {}

  async putOTC(
    code: string,
    payload: { userId: string; email: string; role: string },
    ttlSec = 120,
  ): Promise<void> {
    await this.redis.set(`otc:${code}`, JSON.stringify(payload), 'EX', ttlSec);
  }

  async takeOTC(code: string): Promise<{ userId: string; email: string; role: string } | null> {
    const data = await this.redis.get(`otc:${code}`);
    if (!data) return null;

    await this.redis.del(`otc:${code}`); // one-time use
    return JSON.parse(data);
  }
}
