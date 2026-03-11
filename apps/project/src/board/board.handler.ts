// board.handler.ts
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { BoardService } from './board.service';


@Controller()
export class BoardHandler {
  private readonly logger = new Logger(BoardHandler.name);

  constructor(private readonly boardService: BoardService) {}

  @MessagePattern({ cmd: 'board.create' })
  async handleCreateBoard(@Payload() payload: CreateBoardDto) {
    this.logger.log(`[board.create] Received payload: ${JSON.stringify(payload)}`);

    try {
      const board = await this.boardService.createBoard(payload);
      return { success: true, data: board };
    } catch (error: any) {
      this.logger.error(`Error handling board.create: ${error.message}`, error.stack);
      return { success: false, message: error.message };
    }
  }

  @MessagePattern({ cmd: 'board.get' })
  async handleGetBoards(@Payload() payload: GetBoardsDto) {
    this.logger.log(`[board.get] Received payload: ${JSON.stringify(payload)}`);

    try {
      const boards = await this.boardService.getBoards(payload);
      return { success: true, data: boards };
    } catch (error: any) {
      this.logger.error(`Error handling board.get: ${error.message}`, error.stack);
      return { success: false, message: error.message };
    }
  }

  @MessagePattern({ cmd: 'board.update' })
  async handleUpdateBoard(@Payload() payload: UpdateBoardDto) {
    this.logger.log(`[board.update] Received payload: ${JSON.stringify(payload)}`);

    try {
      const board = await this.boardService.updateBoard(payload.boardId, payload.data);
      return { success: true, data: board };
    } catch (error: any) {
      this.logger.error(`Error handling board.update: ${error.message}`, error.stack);
      return { success: false, message: error.message };
    }
  }

  @MessagePattern({ cmd: 'board.delete' })
  async handleDeleteBoard(@Payload() payload: DeleteBoardDto | { boardId: string }) {
    this.logger.log(`[board.delete] Received payload: ${JSON.stringify(payload)}`);

    try {
      const boardId = 'boardId' in payload ? payload.boardId : (payload as any).id;
      const result = await this.boardService.deleteBoard(boardId);
      return { success: true, data: result };
    } catch (error: any) {
      this.logger.error(`Error handling board.delete: ${error.message}`, error.stack);
      return { success: false, message: error.message };
    }
  }
}