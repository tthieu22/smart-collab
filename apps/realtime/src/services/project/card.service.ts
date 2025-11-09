// src/realtime/services/card.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { LockService } from '../lock.service';
import { LockResult } from '../../interfaces/lock-result.interface';

@Injectable()
export class CardService {
  private readonly logger = new Logger(CardService.name);

  constructor(
    private readonly amqp: AmqpConnection,
    private readonly lockService: LockService,
  ) {}

  private async request(pattern: string, data: any): Promise<any> {
    this.logger.log(`[Card RPC] → ${pattern}`, data);
    try {
      const result = await this.amqp.request({
        exchange: 'smart-collab',
        routingKey: pattern,
        payload: data,
        timeout: 10000,
      });
      this.logger.log(`[Card RPC] ← ${pattern}`, result);
      return result;
    } catch (err: any) {
      this.logger.error(`[Card RPC] Failed ${pattern}`, err.message);
      throw err;
    }
  }

  // TẠO CARD → có kết quả
  async createCard(payload: any, userId: string) {
    const dto = { ...payload, ownerId: userId };
    const result = await this.request('card.create', dto);
    return {
      status: 'success',
      correlationId: payload.correlationId,
      data: result.data,
    };
  }

  // CẬP NHẬT → có kết quả
  async updateCard(payload: any) {
    const result = await this.request('card.update', payload);
    return {
      status: 'success',
      correlationId: payload.correlationId,
      data: result.data,
    };
  }

  // XÓA → có kết quả + LOCK
  async deleteCard(payload: any, userId: string): Promise<LockResult> {
    const { projectId, cardId, correlationId } = payload;
    return this.lockService.emitWithLock(
      projectId,
      cardId,
      userId,
      async () => {
        const result = await this.request('card.delete', { projectId, cardId, correlationId });
        return { status: 'success', correlationId, data: result.data };
      },
    );
  }

  // DI CHUYỂN → có kết quả + LOCK
  async moveCard(payload: any, userId: string): Promise<LockResult> {
    const { projectId, cardId, correlationId } = payload;
    console.log(payload)
    return this.lockService.emitWithLock(
      projectId,
      cardId,
      userId,
      async () => {
        const result = await this.request('card.move', payload);
        return { status: 'success', correlationId, data: result.data };
      },
    );
  }

  // SAO CHÉP → CÓ KẾT QUẢ + LOCK (MỚI THÊM)
  async copyCard(payload: any, userId: string): Promise<LockResult> {
    const { projectId, cardId, correlationId } = payload;

    return this.lockService.emitWithLock(
      projectId,
      cardId,
      userId,
      async () => {
        const result = await this.request('card.copy', payload);
        return {
          status: 'success',
          correlationId,
          data: result.data, 
        };
      },
    );
  }
}