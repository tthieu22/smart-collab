// src/realtime/services/board.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { LockService } from '../lock.service';
import { LockResult } from '../../interfaces/lock-result.interface';

@Injectable()
export class BoardService {
  private readonly logger = new Logger(BoardService.name);

  constructor(
    private readonly amqp: AmqpConnection,
    private readonly lockService: LockService,
  ) {}

  // GỬI VÀ NHẬN KẾT QUẢ (RPC)
  private async request(pattern: string, data: any): Promise<any> {
    this.logger.log(`[Board RPC] → ${pattern}`, data);
    try {
      const result = await this.amqp.request({
        exchange: 'smart-collab',
        routingKey: pattern,
        payload: data,
        timeout: 15000,
      });
      this.logger.log(`[Board RPC] ← ${pattern}`, result);
      return result;
    } catch (err: any) {
      this.logger.error(`[Board RPC] Failed ${pattern}`, err.message);
      throw err;
    }
  }

  // TẠO BOARD → CÓ KẾT QUẢ
  async createBoard(payload: any, userId: string) {
    const dto = { ...payload, ownerId: userId };
    const result = await this.request('board.create', dto);
    return {
      status: 'success',
      correlationId: payload.correlationId,
      data: result.data,
    };
  }

  // CẬP NHẬT BOARD → CÓ KẾT QUẢ
  async updateBoard(payload: any) {
    const result = await this.request('board.update', payload);
    return {
      status: 'success',
      correlationId: payload.correlationId,
      data: result.data,
    };
  }

  // XÓA BOARD → CÓ KẾT QUẢ + LOCK
  async deleteBoard(payload: any, userId: string): Promise<LockResult> {
    const { projectId, boardId, correlationId } = payload;

    return this.lockService.emitWithLock(
      projectId,
      boardId,
      userId,
      async () => {
        const result = await this.request('board.delete', {
          projectId,
          boardId,
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

  // LẤY TẤT CẢ BOARD → CÓ KẾT QUẢ
  async getBoards(payload: any) {
    const result = await this.request('board.get', payload);
    return {
      status: 'success',
      correlationId: payload.correlationId,
      data: result.data,
    };
  }
}