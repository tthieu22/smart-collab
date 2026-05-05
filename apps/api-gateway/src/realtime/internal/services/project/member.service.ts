import { Injectable, Logger } from '@nestjs/common';
import { ProjectService } from '../../../../project/project.service';
import { LockService } from '../lock.service';
import { LockResult } from '../../interfaces/lock-result.interface';

@Injectable()
export class MemberService {
  private readonly logger = new Logger(MemberService.name);

  constructor(
    private readonly projectService: ProjectService,
    private readonly lockService: LockService,
  ) {}

  private async request(pattern: string, data: any): Promise<any> {
    try {
      return await this.projectService.send({ cmd: pattern }, data);
    } catch (err: any) {
      this.logger.error(`[Member RPC] Failed ${pattern}: ${err.message}`);
      throw err;
    }
  }

  // 🟢 THÊM THÀNH VIÊN (có Lock)
  async addMember(payload: any, userId: string): Promise<LockResult> {
    const { projectId, memberId, correlationId } = payload;
    return this.lockService.emitWithLock(
      projectId,
      `member:${memberId}`,
      userId,
      async () => {
        const result = await this.request('project.member.add', payload);
        return {
          status: 'success',
          correlationId,
          data: result.data,
        };
      },
    );
  }

  // 🔴 XÓA THÀNH VIÊN (có Lock)
  async removeMember(payload: any, userId: string): Promise<LockResult> {
    const { projectId, memberId, correlationId } = payload;
    return this.lockService.emitWithLock(
      projectId,
      `member:${memberId}`,
      userId,
      async () => {
        const result = await this.request('project.member.remove', payload);
        return {
          status: 'success',
          correlationId,
          data: result.data,
        };
      },
    );
  }

  // 🟡 CẬP NHẬT VAI TRÒ (có Lock)
  async updateMemberRole(payload: any, userId: string): Promise<LockResult> {
    const { projectId, memberId, correlationId } = payload;
    return this.lockService.emitWithLock(
      projectId,
      `member:${memberId}`,
      userId,
      async () => {
        const result = await this.request('project.member.role.update', payload);
        return {
          status: 'success',
          correlationId,
          data: result.data,
        };
      },
    );
  }

  // 🟣 KIỂM TRA THÀNH VIÊN
  async isMember(projectId: string, userId: string): Promise<{ status: string; data: boolean }> {
    const result = await this.request('project.member.check', { projectId, userId });
    return {
      status: 'success',
      data: result?.isMember ?? false,
    };
  }
}
