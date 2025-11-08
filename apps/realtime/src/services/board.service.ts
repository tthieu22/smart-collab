import { Injectable, Logger } from '@nestjs/common';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { EmitService } from './emit.service';
import {
  CreateBoardDto,
  UpdateBoardDto,
  DeleteBoardDto,
  GetBoardsDto,
  BoardResultMessage,
} from './dto/board.dto';

@Injectable()
export class BoardService {
  private readonly logger = new Logger(BoardService.name);

  constructor(
    private readonly amqpConnection: AmqpConnection,
    private readonly emitService: EmitService,
  ) {}

  async handleCreateBoard(
    payload: CreateBoardDto & { correlationId?: string },
    excludeClientId?: string,
  ): Promise<any> {
    try {
      this.amqpConnection.publish('realtime-exchange', 'board.create', payload);
      return { status: 'pending' };
    } catch (err) {
      this.logger.error(`[BoardService] createBoard failed:`, err);
      throw err;
    }
  }

  async handleUpdateBoard(
    payload: UpdateBoardDto & { correlationId?: string },
    excludeClientId?: string,
  ): Promise<any> {
    try {
      this.amqpConnection.publish('realtime-exchange', 'board.update', payload);
      return { status: 'pending' };
    } catch (err) {
      this.logger.error(`[BoardService] updateBoard failed:`, err);
      throw err;
    }
  }

  async handleDeleteBoard(
    payload: DeleteBoardDto & { correlationId?: string },
    excludeClientId?: string,
  ): Promise<void> {
    try {
      this.amqpConnection.publish('realtime-exchange', 'board.delete', payload);
    } catch (err) {
      this.logger.error(`[BoardService] deleteBoard failed:`, err);
      throw err;
    }
  }

  getBoards(data: GetBoardsDto) {
    return this.amqpConnection.publish('realtime-exchange', 'board.get', data);
  }
}
