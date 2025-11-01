import { Injectable } from '@nestjs/common';
import { AmqpConnection, RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import { EmitService } from './emit.service';
import { CreateBoardDto, UpdateBoardDto, DeleteBoardDto, GetBoardsDto, BoardResultMessage } from './dto/board.dto';

@Injectable()
export class BoardService {
  constructor(
    private readonly amqpConnection: AmqpConnection,
    private readonly emitService: EmitService,
  ) {}

  createBoard(data: CreateBoardDto) {
    return this.amqpConnection.publish('realtime-exchange', 'board.create', data);
  }

  updateBoard(data: UpdateBoardDto) {
    return this.amqpConnection.publish('realtime-exchange', 'board.update', data);
  }

  deleteBoard(data: DeleteBoardDto) {
    return this.amqpConnection.publish('realtime-exchange', 'board.delete', data);
  }

  getBoards(data: GetBoardsDto) {
    return this.amqpConnection.publish('realtime-exchange', 'board.get', data);
  }
}
