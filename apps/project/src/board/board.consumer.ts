// board.consumer.ts
import { Injectable } from '@nestjs/common';
import { RabbitSubscribe, AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { BoardService } from './board.service';

@Injectable()
export class BoardConsumer {
  constructor(
    private readonly amqpConnection: AmqpConnection,
    private readonly boardService: BoardService,
  ) {}

  // ---------------- CREATE BOARD ----------------
  @RabbitSubscribe({
    exchange: 'realtime-exchange',
    routingKey: 'board.create',
    queue: 'project-service.board-create',
  })
  async handleCreateBoard(msg: CreateBoardDto) {
    try {
      const board = await this.boardService.createBoard(msg);
      await this.amqpConnection.publish('project-exchange', 'board.result', {
        status: 'success',
        action: 'create',
        board,
      });
    } catch (error) {
      await this.amqpConnection.publish('project-exchange', 'board.result', {
        status: 'error',
        action: 'create',
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }

  // ---------------- GET BOARDS ----------------
  @RabbitSubscribe({
    exchange: 'realtime-exchange',
    routingKey: 'board.get',
    queue: 'project-service.board-get',
  })
  async handleGetBoards(msg: GetBoardsDto) {
    try {
      const boards = await this.boardService.getBoards(msg);
      await this.amqpConnection.publish('project-exchange', 'board.result', {
        status: 'success',
        action: 'get',
        boards,
      });
    } catch (error) {
      await this.amqpConnection.publish('project-exchange', 'board.result', {
        status: 'error',
        action: 'get',
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }

  // ---------------- UPDATE BOARD ----------------
  @RabbitSubscribe({
    exchange: 'realtime-exchange',
    routingKey: 'board.update',
    queue: 'project-service.board-update',
  })
  async handleUpdateBoard(msg: UpdateBoardDto) {
    try {
      const board = await this.boardService.updateBoard(msg.boardId, msg.data);
      await this.amqpConnection.publish('project-exchange', 'board.result', {
        status: 'success',
        action: 'update',
        board,
      });
    } catch (error) {
      await this.amqpConnection.publish('project-exchange', 'board.result', {
        status: 'error',
        action: 'update',
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }

  // ---------------- DELETE BOARD ----------------
  @RabbitSubscribe({
    exchange: 'realtime-exchange',
    routingKey: 'board.delete',
    queue: 'project-service.board-delete',
  })
  async handleDeleteBoard(msg: DeleteBoardDto) {
    try {
      const result = await this.boardService.deleteBoard(msg.boardId);
      await this.amqpConnection.publish('project-exchange', 'board.result', {
        status: 'success',
        action: 'delete',
        boardId: result.boardId,
      });
    } catch (error) {
      await this.amqpConnection.publish('project-exchange', 'board.result', {
        status: 'error',
        action: 'delete',
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }
}
