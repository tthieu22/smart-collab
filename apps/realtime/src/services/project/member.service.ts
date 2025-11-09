// src/realtime/services/member.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { LockService } from '../lock.service';
import { LockResult } from '../../interfaces/lock-result.interface';

@Injectable()
export class MemberService {
  private readonly logger = new Logger(MemberService.name);

  constructor(
    private readonly amqp: AmqpConnection,
    private readonly lockService: LockService,
  ) {}

  // GỬI VÀ NHẬN KẾT QUẢ (RPC)
  private async request(pattern: string, data: any): Promise<any> {
    this.logger.log(`[Member RPC] → ${pattern}`, data);
    try {
      const result = await this.amqp.request({
        exchange: 'smart-collab',
        routingKey: pattern,
        payload: data,
        timeout: 10000,
      });
      this.logger.log(`[Member RPC] ← ${pattern}`, result);
      return result;
    } catch (err: any) {
      this.logger.error(`[Member RPC] Failed ${pattern}`, err.message);
      throw err;
    }
  }

  // THÊM THÀNH VIÊN → CÓ KẾT QUẢ + LOCK
  async addMember(payload: any, userId: string): Promise<LockResult> {
    const { projectId, memberId, correlationId } = payload;

    return this.lockService.emitWithLock(
      projectId,
      `member:${memberId}`,
      userId,
      async () => {
        const result = await this.request('member.add', payload);
        return {
          status: 'success',
          correlationId,
          data: result.data,
        };
      },
    );
  }

  // XÓA THÀNH VIÊN → CÓ KẾT QUẢ + LOCK
  async removeMember(payload: any, userId: string): Promise<LockResult> {
    const { projectId, memberId, correlationId } = payload;

    return this.lockService.emitWithLock(
      projectId,
      `member:${memberId}`,
      userId,
      async () => {
        const result = await this.request('member.remove', payload);
        return {
          status: 'success',
          correlationId,
          data: result.data,
        };
      },
    );
  }

  // CẬP NHẬT VAI TRÒ → CÓ KẾT QUẢ + LOCK
  async updateMemberRole(payload: any, userId: string): Promise<LockResult> {
    const { projectId, memberId, correlationId } = payload;

    return this.lockService.emitWithLock(
      projectId,
      `member:${memberId}`,
      userId,
      async () => {
        const result = await this.request('member.role.update', payload);
        return {
          status: 'success',
          correlationId,
          data: result.data,
        };
      },
    );
  }

  async isMember(projectId: string, userId: string): Promise<LockResult> {
    return this.lockService.emitWithLock(
      projectId,
      `member:${userId}`,
      userId,
      async () => {
        const result = await this.request('member.check', { projectId, userId });
        return {
          status: 'success',
          data: result?.isMember ?? false,
        };
      },
    );
  }
}