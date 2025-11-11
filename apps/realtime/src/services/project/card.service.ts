import { Inject, Injectable, Logger } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { LockService } from '../lock.service';
import { LockResult } from '../../interfaces/lock-result.interface';

@Injectable()
export class CardService {
  private readonly logger = new Logger(CardService.name);

  constructor(
    @Inject('PROJECT_SERVICE') private readonly projectClient: ClientProxy,
    private readonly lockService: LockService,
  ) {}

  private async request(pattern: string, data: any): Promise<any> {
    this.logger.log(`[Card RPC] → ${pattern}, payload: ${JSON.stringify(data)}`);
    try {
      // 👇 Không cần import rxjs
      const result = await this.projectClient.send({ cmd: pattern }, data).toPromise();
      this.logger.log(`[Card RPC] ← ${pattern}, result: ${JSON.stringify(result)}`);
      return result;
    } catch (err: any) {
      this.logger.error(`[Card RPC] Failed ${pattern}: ${err.message}`);
      throw err;
    }
  }

  async createCard(payload: any, userId: string) {
    const dto = { ...payload, createdById: userId };
    const result = await this.request('project.card.create', dto);
    return {
      status: 'success',
      correlationId: payload.correlationId,
      data: result.data,
    };
  }

  async updateCard(payload: any) {
    const result = await this.request('project.card.update', payload);
    return {
      status: 'success',
      correlationId: payload.correlationId,
      data: result.data,
    };
  }

  async deleteCard(payload: any, userId: string): Promise<LockResult> {
    const { projectId, cardId, correlationId } = payload;
    return this.lockService.emitWithLock(
      projectId,
      cardId,
      userId,
      async () => {
        const result = await this.request('project.card.delete', { projectId, cardId, correlationId });
        return { status: 'success', correlationId, data: result.data };
      },
    );
  }

  async moveCard(payload: any, userId: string): Promise<LockResult> {
    const { projectId, cardId, correlationId } = payload;
    return this.lockService.emitWithLock(
      projectId,
      cardId,
      userId,
      async () => {
        const result = await this.request('project.card.move', payload);
        return { status: 'success', correlationId, data: result.data };
      },
    );
  }

  async copyCard(payload: any, userId: string): Promise<LockResult> {
    const { projectId, cardId, correlationId } = payload;
    return this.lockService.emitWithLock(
      projectId,
      cardId,
      userId,
      async () => {
        const result = await this.request('project.card.copy', payload);
        return {
          status: 'success',
          correlationId,
          data: result.data,
        };
      },
    );
  }
}
