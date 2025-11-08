import { Injectable, Logger } from '@nestjs/common';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { EmitService } from './emit.service';
import { LockService } from './lock.service';
import { LockResult } from '../interfaces/lock-result.interface';
import {
  CreateCardDto,
  UpdateCardDto,
  DeleteCardDto,
  GetCardDto,
  CardResultMessage,
  CardMovePayloadInner,
} from './dto/card.dto';

@Injectable()
export class CardService {
  private readonly logger = new Logger(CardService.name);

  constructor(
    private readonly amqpConnection: AmqpConnection,
    private readonly emitService: EmitService,
    private readonly lockService: LockService,
  ) {}

  async handleCreateCard(
    payload: CreateCardDto & { correlationId?: string; ownerId?: string },
    excludeClientId?: string,
  ): Promise<any> {
    try {
      this.amqpConnection.publish('realtime-exchange', 'card.create', payload);
      return { status: 'pending' };
    } catch (err) {
      this.logger.error(`[CardService] createCard failed:`, err);
      throw err;
    }
  }

  async handleUpdateCard(
    payload: UpdateCardDto & { correlationId?: string; projectId?: string },
    excludeClientId?: string,
  ): Promise<any> {
    try {
      this.amqpConnection.publish('realtime-exchange', 'card.update', payload);
      return { status: 'pending' };
    } catch (err) {
      this.logger.error(`[CardService] updateCard failed:`, err);
      throw err;
    }
  }

  async handleDeleteCard(
    payload: DeleteCardDto & {
      correlationId?: string;
      projectId?: string;
      columnId?: string;
    },
    userId: string,
    excludeClientId?: string,
  ): Promise<LockResult> {
    if (!payload.projectId) {
      throw new Error('projectId is required for deleteCard');
    }

    return this.lockService.emitWithLock(
      payload.projectId,
      payload.cardId,
      userId,
      async () => {
        try {
          this.amqpConnection.publish(
            'realtime-exchange',
            'card.delete',
            payload,
          );
        } catch (err) {
          this.logger.error(`[CardService] deleteCard failed:`, err);
          throw err;
        }
      },
    );
  }

  async handleMoveCard(
    projectId: string,
    payload: CardMovePayloadInner & { correlationId?: string },
    userId: string,
    excludeClientId?: string,
  ): Promise<LockResult> {
    if (!projectId) {
      return { status: 'error', message: 'projectId is required' };
    }
    
    console.log('  projectId:', projectId);
    console.log('  payload:', payload);
    console.log('  userId:', userId);
    console.log('  excludeClientId:', excludeClientId);


    return this.lockService.emitWithLock(
      projectId,
      payload.cardId,
      userId,
      async () => {
        try {
          this.amqpConnection.publish(
            'realtime-exchange',
            'card.move',
            payload,
          );
        } catch (err) {
          this.logger.error(`[CardService] moveCard failed:`, err);
          throw err;
        }
      },
    );
  }


  getCard(data: GetCardDto) {
    return this.amqpConnection.publish('realtime-exchange', 'card.get', data);
  }
}
