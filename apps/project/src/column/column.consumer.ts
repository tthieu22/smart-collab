// column.consumer.ts
import { Injectable } from '@nestjs/common';
import { RabbitSubscribe, AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { PrismaService } from '../../prisma/prisma.service';
import { ColumnMessage } from '../dto/column.dto';

@Injectable()
export class ColumnConsumer {
  constructor(
    private readonly amqpConnection: AmqpConnection,
    private readonly prisma: PrismaService,
  ) {}

  @RabbitSubscribe({
    exchange: 'smart-collab',
    routingKey: 'column.move',
    queue: 'project-service.column_move',
  })
  async handleMoveColumn(msg: ColumnMessage) {
    try {
      const column = await this.prisma.column.findUnique({
        where: { id: msg.columnId },
      });

      if (!column) throw new Error('Column not found');

      // version check nếu cần
      if (msg.version !== undefined && column.position !== msg.fromPosition) {
        throw new Error('Version conflict');
      }

      // update position
      const updatedColumn = await this.prisma.column.update({
        where: { id: msg.columnId },
        data: {
          position: msg.toPosition,
          updatedAt: new Date(),
        },
      });

      await this.amqpConnection.publish('project-exchange', 'column.moved', {
        correlationId: msg.correlationId,
        column: updatedColumn,
      });
    } catch (error) {
      console.error('Column move error:', error);
      await this.amqpConnection.publish('project-exchange', 'column.moved', {
        correlationId: msg.correlationId,
        status: 'error',
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }
}
