import { Injectable } from '@nestjs/common';

@Injectable()
export class OtcService {
  private store = new Map<string, { payload: any; expiresAt: number }>();

  async putOTC(
    code: string,
    payload: { userId: string; email: string; role?: string | undefined },
    ttlSec = 120,
  ): Promise<void> {
    const expiresAt = Date.now() + ttlSec * 1000;
    this.store.set(code, { payload, expiresAt });
    
    // Cleanup after TTL
    setTimeout(() => {
      this.store.delete(code);
    }, ttlSec * 1000);
  }

  async takeOTC(
    code: string,
  ): Promise<{ userId: string; email: string; role: string } | null> {
    const entry = this.store.get(code);
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.store.delete(code);
      return null;
    }

    this.store.delete(code); // one-time use
    return entry.payload;
  }
}
