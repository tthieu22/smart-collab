import { Injectable, Logger } from '@nestjs/common';
import { ProjectService } from '../../../../project/project.service';
import { LockService } from '../lock.service';
import { LockResult } from '../../interfaces/lock-result.interface';

@Injectable()
export class BoardService {
  private readonly logger = new Logger(BoardService.name);

  constructor(
    private readonly projectService: ProjectService,
    private readonly lockService: LockService,
  ) {}

  private async request(pattern: string, data: any): Promise<any> {
    try {
      return await this.projectService.send({ cmd: pattern }, data);
    } catch (err: any) {
      this.logger.error(`[Board RPC] Failed ${pattern}: ${err.message}`);
      throw err;
    }
  }

  // 🟢 TẠO BOARD
  async createBoard(payload: any, userId: string) {
    const dto = { ...payload, createdById: userId };
    const result = await this.request('project.board.create', dto);
    return {
      status: 'success',
      correlationId: payload.correlationId,
      data: result.data,
    };
  }

  // 🟡 CẬP NHẬT BOARD
  async updateBoard(payload: any) {
    const result = await this.request('project.board.update', payload);
    return {
      status: 'success',
      correlationId: payload.correlationId,
      data: result.data,
    };
  }

  // 🔴 XÓA BOARD (Có Lock)
  async deleteBoard(payload: any, userId: string): Promise<LockResult> {
    const { projectId, boardId, correlationId } = payload;
    return this.lockService.emitWithLock(
      projectId,
      boardId,
      userId,
      async () => {
        const result = await this.request('project.board.delete', { projectId, boardId, correlationId });
        return {
          status: 'success',
          correlationId,
          data: result.data,
        };
      },
    );
  }

  // 🟣 LẤY DANH SÁCH BOARD
  async getBoards(payload: any) {
    const result = await this.request('project.board.get', payload);
    return {
      status: 'success',
      correlationId: payload.correlationId,
      data: result.data,
    };
  }

  // 🟤 SAO CHÉP BOARD (nếu có tính năng)
  async copyBoard(payload: any, userId: string): Promise<LockResult> {
    const { projectId, boardId, correlationId } = payload;
    return this.lockService.emitWithLock(
      projectId,
      boardId,
      userId,
      async () => {
        const result = await this.request('project.board.copy', payload);
        return {
          status: 'success',
          correlationId,
          data: result.data,
        };
      },
    );
  }
}
