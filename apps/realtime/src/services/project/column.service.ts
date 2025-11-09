// src/realtime/services/column.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { LockService } from '../lock.service';
import { LockResult } from '../../interfaces/lock-result.interface';

@Injectable()
export class ColumnService {
  private readonly logger = new Logger(ColumnService.name);

  constructor(
    private readonly amqp: AmqpConnection,
    private readonly lockService: LockService,
  ) {}

  // GỬI VÀ NHẬN KẾT QUẢ (RPC)
  private async request(pattern: string, data: any): Promise<any> {
    this.logger.log(`[Column RPC] → ${pattern}`, data);
    try {
      const result = await this.amqp.request({
        exchange: 'smart-collab',
        routingKey: pattern,
        payload: data,
        timeout: 15000,
      });
      this.logger.log(`[Column RPC] ← ${pattern}`, result);
      return result;
    } catch (err: any) {
      this.logger.error(`[Column RPC] Failed ${pattern}`, err.message);
      throw err;
    }
  }

  // TẠO CỘT → CÓ KẾT QUẢ
  async createColumn(payload: any, userId: string) {
    const dto = { ...payload, ownerId: userId };
    const result = await this.request('column.create', dto);
    return {
      status: 'success',
      correlationId: payload.correlationId,
      data: result.data,
    };
  }

  // CẬP NHẬT CỘT → CÓ KẾT QUẢ
  async updateColumn(payload: any) {
    const result = await this.request('column.update', payload);
    return {
      status: 'success',
      correlationId: payload.correlationId,
      data: result.data,
    };
  }

  // XÓA CỘT → CÓ KẾT QUẢ + LOCK
  async deleteColumn(payload: any, userId: string): Promise<LockResult> {
    const { projectId, columnId, correlationId } = payload;

    return this.lockService.emitWithLock(
      projectId,
      columnId,
      userId,
      async () => {
        const result = await this.request('column.delete', {
          projectId,
          columnId,
          correlationId,
        });
        return {
          status: 'success',
          correlationId,
          data: result.data,
        };
      },
    );
  }

  // DI CHUYỂN CỘT → CÓ KẾT QUẢ + LOCK
  async moveColumn(payload: any, userId: string): Promise<LockResult> {
    const { projectId, columnId, correlationId } = payload;

    return this.lockService.emitWithLock(
      projectId,
      columnId,
      userId,
      async () => {
        const result = await this.request('column.move', payload);
        return {
          status: 'success',
          correlationId,
          data: result.data,
        };
      },
    );
  }
}