import { Injectable } from '@nestjs/common';
import { AmqpConnection, RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import { EmitService } from './emit.service';
import {
  CreateColumnDto,
  UpdateColumnDto,
  DeleteColumnDto,
  GetColumnDto
} from './dto/column.dto';

@Injectable()
export class ColumnService {
  constructor(
    private readonly amqpConnection: AmqpConnection,
    private readonly emitService: EmitService,
  ) {}

  createColumn(data: CreateColumnDto) {
    console.log(data);
    return this.amqpConnection.publish('realtime-exchange', 'column.create', data);
  }

  updateColumn(data: UpdateColumnDto) {
    
    return this.amqpConnection.publish('realtime-exchange', 'column.update', data);
  }

  deleteColumn(data: DeleteColumnDto) {
    return this.amqpConnection.publish('realtime-exchange', 'column.delete', data);
  }

  getColumn(data: GetColumnDto) {
    return this.amqpConnection.publish('realtime-exchange', 'column.get', data);
  }
}
