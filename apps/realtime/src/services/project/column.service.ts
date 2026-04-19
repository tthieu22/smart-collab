import { Inject, Injectable, Logger } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { LockService } from '../lock.service';
import { LockResult } from '../../interfaces/lock-result.interface';

@Injectable()
export class ColumnService {
  private readonly logger = new Logger(ColumnService.name);

  constructor(
    @Inject('PROJECT_SERVICE') private readonly projectClient: ClientProxy,
    private readonly lockService: LockService,
  ) {}

  private async request(pattern: string, data: any): Promise<any> {
    // this.logger.log(`[Column RPC] → ${pattern}, payload: ${JSON.stringify(data)}`);
    try {
      const result = await this.projectClient.send({ cmd: pattern }, data).toPromise();
      // this.logger.log(`[Column RPC] ← ${pattern}, result: ${JSON.stringify(result)}`);
      return result;
    } catch (err: any) {
      this.logger.error(`[Column RPC] Failed ${pattern}: ${err.message}`);
      throw err;
    }
  }

  async createColumn(payload: any, userId: string) {
    const dto = { ...payload, createdById: userId };
    const result = await this.request('project.column.create', dto);
    return {
      status: 'success',
      correlationId: payload.correlationId,
      data: result.data,
    };
  }

  async updateColumn(payload: any) {
    const result = await this.request('project.column.update', payload);
    return {
      status: 'success',
      correlationId: payload.correlationId,
      data: result.data,
    };
  }

  async deleteColumn(payload: any, userId: string): Promise<LockResult> {
    const { projectId, columnId, correlationId } = payload;
    return this.lockService.emitWithLock(
      projectId,
      columnId,
      userId,
      async () => {
        const result = await this.request('project.column.delete', { projectId, columnId, correlationId });
        return {
          status: 'success',
          correlationId,
          data: result.data,
        };
      },
    );
  }

  async moveColumn(payload: any, userId: string): Promise<LockResult> {
    const { projectId, correlationId, payload: innerPayload } = payload;
    const columnId = innerPayload?.columnId;

    return this.lockService.emitWithLock(
      projectId,
      columnId,
      userId,
      async () => {
        const result = await this.request('project.column.move', payload);
        return {
          status: 'success',
          correlationId,
          data: result.data,
        };
      },
    );
  }


  async copyColumn(payload: any, userId: string): Promise<LockResult> {
    const { projectId, columnId, correlationId } = payload;
    return this.lockService.emitWithLock(
      projectId,
      columnId,
      userId,
      async () => {
        const result = await this.request('project.column.copy', payload);
        return {
          status: 'success',
          correlationId,
          data: result.data,
        };
      },
    );
  }

  async getColumns(payload: { projectId?: string; boardId?: string }) {
    if (payload?.boardId) {
      return this.request('project.get.columnsByBoard', payload.boardId);
    }
    if (payload?.projectId) {
      return this.request('project.get.columnsByProject', payload.projectId);
    }
    throw new Error('projectId or boardId is required');
  }
}
