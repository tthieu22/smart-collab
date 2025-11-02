import { Injectable } from '@nestjs/common';
import { RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import { ColumnService } from './column.service';

@Injectable()
export class ColumnConsumer {
  constructor(private readonly columnService: ColumnService) {}

  @RabbitSubscribe({
    exchange: 'realtime-exchange',
    routingKey: 'column.create',
    queue: 'project-service.column-create',
  })
  async handleCreateColumn(msg: any) {
    try {
      await this.columnService.createColumn(msg);
    } catch (error) {
      console.error('[ColumnConsumer] createColumn failed:', error);
    }
  }

  @RabbitSubscribe({
    exchange: 'realtime-exchange',
    routingKey: 'column.update',
    queue: 'project-service.column-update',
  })
  async handleUpdateColumn(msg: any) {
    try {
      await this.columnService.updateColumn(msg);
    } catch (error) {
      console.error('[ColumnConsumer] updateColumn failed:', error);
    }
  }

  @RabbitSubscribe({
    exchange: 'realtime-exchange',
    routingKey: 'column.delete',
    queue: 'project-service.column-delete',
  })
  async handleDeleteColumn(msg: any) {
    try {
      await this.columnService.removeColumn(msg.columnId);
    } catch (error) {
      console.error('[ColumnConsumer] removeColumn failed:', error);
    }
  }

  @RabbitSubscribe({
    exchange: 'realtime-exchange',
    routingKey: 'column.get',
    queue: 'project-service.column-get',
  })
  async handleGetColumns(msg: any) {
    try {
      if (msg.columnId) await this.columnService.getColumnById(msg.columnId);
      else if (msg.boardId) await this.columnService.getColumnsByBoard(msg.boardId);
      else if (msg.projectId) await this.columnService.getColumnsByProject(msg.projectId);
      else console.warn('[ColumnConsumer] Missing query parameter');
    } catch (error) {
      console.error('[ColumnConsumer] getColumns failed:', error);
    }
  }
}
