import { Injectable } from '@nestjs/common';
import { RabbitSubscribe, AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { ColumnService } from './column.service';

@Injectable()
export class ColumnConsumer {
  constructor(
    private readonly amqpConnection: AmqpConnection,
    private readonly columnService: ColumnService,
  ) {}

  @RabbitSubscribe({
    exchange: 'realtime-exchange',
    routingKey: 'column.create',
    queue: 'project-service.column-create',
  })
  async handleCreateColumn(msg: { boardId: string; title: string }) {
    try {
      const column = await this.columnService.createColumn(msg);
      await this.amqpConnection.publish('project-exchange', 'column.result', {
        status: 'success',
        action: 'create',
        column,
      });
    } catch (error) {
      await this.amqpConnection.publish('project-exchange', 'column.result', {
        status: 'error',
        action: 'create',
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }

  @RabbitSubscribe({
    exchange: 'realtime-exchange',
    routingKey: 'column.update',
    queue: 'project-service.column-update',
  })
  async handleUpdateColumn(msg: { columnId: string; title?: string; position?: number }) {
    try {
      const column = await this.columnService.updateColumn(msg);
      await this.amqpConnection.publish('project-exchange', 'column.result', {
        status: 'success',
        action: 'update',
        column,
      });
    } catch (error) {
      await this.amqpConnection.publish('project-exchange', 'column.result', {
        status: 'error',
        action: 'update',
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }

  @RabbitSubscribe({
    exchange: 'realtime-exchange',
    routingKey: 'column.delete',
    queue: 'project-service.column-delete',
  })
  async handleDeleteColumn(msg: { columnId: string }) {
    try {
      const result = await this.columnService.removeColumn(msg.columnId);
      await this.amqpConnection.publish('project-exchange', 'column.result', {
        status: 'success',
        action: 'delete',
        ...result,
      });
    } catch (error) {
      await this.amqpConnection.publish('project-exchange', 'column.result', {
        status: 'error',
        action: 'delete',
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }

  @RabbitSubscribe({
    exchange: 'realtime-exchange',
    routingKey: 'column.get',
    queue: 'project-service.column-get',
  })
  async handleGetColumns(msg: { columnId?: string; boardId?: string; projectId?: string }) {
    try {
      let columns;
      if (msg.columnId) {
        columns = [await this.columnService.getColumnById(msg.columnId)];
      } else if (msg.boardId) {
        columns = await this.columnService.getColumnsByBoard(msg.boardId);
      } else if (msg.projectId) {
        columns = await this.columnService.getColumnsByProject(msg.projectId);
      } else {
        throw new Error('Missing columnId, boardId or projectId');
      }

      await this.amqpConnection.publish('project-exchange', 'column.result', {
        status: 'success',
        action: 'get',
        columns,
      });
    } catch (error) {
      await this.amqpConnection.publish('project-exchange', 'column.result', {
        status: 'error',
        action: 'get',
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }
}
