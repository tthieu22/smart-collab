import { Inject, Injectable, Logger } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices/client';
import { lastValueFrom } from 'rxjs';
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
    // this.logger.log(`[Card RPC] → ${pattern}, payload: ${JSON.stringify(data)}`);
    try {
      const observable = this.projectClient.send({ cmd: pattern }, data);
      const result = await lastValueFrom(observable);
      // this.logger.log(`[Card RPC] ← ${pattern}, result: ${JSON.stringify(result)}`);
      return result;
    } catch (err: any) {
      this.logger.error(`[Card RPC] Failed ${pattern}: ${err.message}`);
      throw err;
    }
  }

  async createCard(payload: any, userId: string) {
    this.logger.log(`[createCard] received payload: ${JSON.stringify(payload)}, userId: ${userId}`);
    const dto = { ...payload, createdById: userId };
    const result = await this.request('project.card.create', dto);
    // this.logger.log(`[createCard] completed with result: ${JSON.stringify(result)}`);
    return result.data ?? result;
  }

  async updateCard(payload: any) {
    this.logger.log(`[updateCard] received payload: ${JSON.stringify(payload)}`);
    const result = await this.request('project.card.update', payload);
    // this.logger.log(`[updateCard] completed with result: ${JSON.stringify(result)}`);
    return result.data ?? result;
  }

  async deleteCard(payload: any, userId: string): Promise<LockResult> {
    this.logger.log(`[deleteCard] received payload: ${JSON.stringify(payload)}, userId: ${userId}`);
    const { projectId, correlationId, payload: innerPayload } = payload;
    const cardId = payload.cardId || innerPayload?.cardId;
    const result = await this.lockService.emitWithLock(
      projectId,
      cardId,
      userId,
      async () => {
        // this.logger.log(`[deleteCard] Acquired lock for projectId=${projectId}, cardId=${cardId}`);
        const res = await this.request('project.card.delete', { projectId, cardId, correlationId });
        // this.logger.log(`[deleteCard] Released lock for projectId=${projectId}, cardId=${cardId}`);
        return { status: 'success', correlationId, data: res };
      },
    );
    // this.logger.log(`[deleteCard] completed with result: ${JSON.stringify(result)}`);
    return result;
  }

  async moveCard(payload: any, userId: string): Promise<LockResult> {
    this.logger.log(`[moveCard] received payload: ${JSON.stringify(payload)}, userId: ${userId}`);

    // Lấy projectId và correlationId trực tiếp
    const { projectId, correlationId, payload: innerPayload } = payload;

    // Lấy cardId bên trong payload.payload nếu có
    const cardId = innerPayload?.cardId;

    const result = await this.lockService.emitWithLock(
      projectId,
      cardId,
      userId,
      async () => {
        // this.logger.log(`[moveCard] Acquired lock for projectId=${projectId}, cardId=${cardId}`);
        const res = await this.request('project.card.move', payload);
        // this.logger.log(`[moveCard] Released lock for projectId=${projectId}, cardId=${cardId}`);
        return { status: 'success', correlationId, data: res };
      },
    );

    // this.logger.log(`[moveCard] completed with result: ${JSON.stringify(result)}`);
    return result;
  }


  async copyCard(payload: any, userId: string): Promise<LockResult> {
    this.logger.log(`[copyCard] received payload: ${JSON.stringify(payload)}, userId: ${userId}`);

    // Giả sử payload có dạng { projectId, correlationId, payload: { cardId, ... } }
    const { projectId, correlationId, payload: innerPayload } = payload;
    const cardId = innerPayload?.cardId;

    const result = await this.lockService.emitWithLock(
      projectId,
      cardId,
      userId,
      async () => {
        // this.logger.log(`[copyCard] Acquired lock for projectId=${projectId}, cardId=${cardId}`);
        const res = await this.request('project.card.copy', payload);
        // this.logger.log(`[copyCard] Released lock for projectId=${projectId}, cardId=${cardId}`);
        return {
          status: 'success',
          correlationId,
          data: res,
        };
      },
    );

    // this.logger.log(`[copyCard] completed with result: ${JSON.stringify(result)}`);
    return result;
  }

  async getCards(payload: { projectId?: string; columnId?: string }) {
    if (payload?.columnId) {
      return this.request('project.get.cardsByColumn', payload.columnId);
    }
    if (payload?.projectId) {
      return this.request('project.get.cardsByProject', payload.projectId);
    }
    throw new Error('projectId or columnId is required');
  }

}
