import { Injectable, Logger } from '@nestjs/common';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { EmitService } from './emit.service';
import { LockService } from './lock.service';
import { LockResult } from '../interfaces/lock-result.interface';
import {
  CreateColumnDto,
  UpdateColumnDto,
  DeleteColumnDto,
  GetColumnDto,
} from './dto/column.dto';

@Injectable()
export class ColumnService {
  private readonly logger = new Logger(ColumnService.name);

  constructor(
    private readonly amqpConnection: AmqpConnection,
    private readonly emitService: EmitService,
    private readonly lockService: LockService,
  ) {}

  async handleCreateColumn(
    payload: CreateColumnDto & { correlationId?: string; ownerId?: string },
    excludeClientId?: string,
  ): Promise<any> {
    try {
      // Publish to RabbitMQ for project service to process
      this.amqpConnection.publish(
        'realtime-exchange',
        'column.create',
        payload,
      );

      // Note: Actual result will come from project service via RabbitMQ consumer
      // For now, we just publish and let the consumer handle the emit
      return { status: 'pending' };
    } catch (err) {
      this.logger.error(`[ColumnService] createColumn failed:`, err);
      throw err;
    }
  }

  async handleUpdateColumn(
    payload: UpdateColumnDto & { correlationId?: string; projectId?: string },
    excludeClientId?: string,
  ): Promise<any> {
    try {
      this.amqpConnection.publish(
        'realtime-exchange',
        'column.update',
        payload,
      );
      return { status: 'pending' };
    } catch (err) {
      this.logger.error(`[ColumnService] updateColumn failed:`, err);
      throw err;
    }
  }

  async handleDeleteColumn(
    payload: DeleteColumnDto & { correlationId?: string; projectId?: string },
    excludeClientId?: string,
  ): Promise<void> {
    try {
      this.amqpConnection.publish(
        'realtime-exchange',
        'column.delete',
        payload,
      );
    } catch (err) {
      this.logger.error(`[ColumnService] deleteColumn failed:`, err);
      throw err;
    }
  }

  async handleMoveColumn(
    payload: {
      projectId: string;
      columnId: string;
      srcBoardId?: string;
      destBoardId?: string;
      destIndex: number;
      correlationId?: string;
    },
    userId: string,
    excludeClientId?: string,
  ): Promise<LockResult> {
    return this.lockService.emitWithLock(
      payload.projectId,
      payload.columnId,
      userId,
      async () => {
        try {
          this.amqpConnection.publish(
            'realtime-exchange',
            'column.move',
            payload,
          );
        } catch (err) {
          this.logger.error(`[ColumnService] moveColumn failed:`, err);
          throw err;
        }
      },
    );
  }

  getColumn(data: GetColumnDto) {
    return this.amqpConnection.publish('realtime-exchange', 'column.get', data);
  }
}
