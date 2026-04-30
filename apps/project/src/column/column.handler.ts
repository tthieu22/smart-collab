import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { ColumnService } from './column.service';

@Controller()
export class ColumnHandler {
  private readonly logger = new Logger(ColumnHandler.name);

  constructor(private readonly columnService: ColumnService) {}

  /** 🟢 Lấy chi tiết 1 column */
  @MessagePattern({ cmd: 'project.get.column' })
  async handleGetColumn(@Payload() columnId: string) {
    this.logger.log(`[handleGetColumn] Request for columnId: ${columnId}`);
    try {
      const column = await this.columnService.getColumnById(columnId);
      return { success: true, data: column };
    } catch (error: any) {
      this.logger.error(`[handleGetColumn] Error: ${error.message}`, error.stack);
      return { success: false, message: error.message || 'Column not found' };
    }
  }

  /** 🟡 Lấy tất cả column trong board */
  @MessagePattern({ cmd: 'project.get.columnsByBoard' })
  async handleGetColumnsByBoard(@Payload() boardId: string) {
    this.logger.log(`[handleGetColumnsByBoard] Request for boardId: ${boardId}`);
    try {
      const columns = await this.columnService.getColumnsByBoard(boardId);
      return { success: true, data: columns };
    } catch (error: any) {
      this.logger.error(`[handleGetColumnsByBoard] Error: ${error.message}`, error.stack);
      return { success: false, message: error.message || 'Columns not found' };
    }
  }

  /** 🟣 Lấy tất cả column trong project */
  @MessagePattern({ cmd: 'project.get.columnsByProject' })
  async handleGetColumnsByProject(@Payload() projectId: string) {
    this.logger.log(`[handleGetColumnsByProject] Request for projectId: ${projectId}`);
    try {
      const columns = await this.columnService.getColumnsByProject(projectId);
      return { success: true, data: columns };
    } catch (error: any) {
      this.logger.error(`[handleGetColumnsByProject] Error: ${error.message}`, error.stack);
      return { success: false, message: error.message || 'Columns not found' };
    }
  }

  /** 🟢 Tạo column mới */
  @MessagePattern({ cmd: 'project.column.create' })
  async handleCreateColumn(@Payload() payload: any) {
    this.logger.log(`[handleCreateColumn] Received payload: ${JSON.stringify(payload)}`);
    try {
      const mergedParams = {
        projectId: payload.projectId,
        correlationId: payload.correlationId,
        ...payload.payload,
        ownerId: payload.createdById,
      };

      this.logger.debug(`[handleCreateColumn] Final params: ${JSON.stringify(mergedParams)}`);
      const result = await this.columnService.createColumn(mergedParams);

      return { status: 'success', correlationId: payload.correlationId, data: result };
    } catch (error: any) {
      this.logger.error(`[handleCreateColumn] Failed: ${error.message}`, error.stack);
      return { status: 'error', message: error.message, correlationId: payload?.correlationId };
    }
  }

  /** 🟡 Cập nhật column */
  @MessagePattern({ cmd: 'project.column.update' })
  async handleUpdateColumn(@Payload() payload: any) {
    this.logger.log(`[handleUpdateColumn] Payload: ${JSON.stringify(payload)}`);
    try {
      const mergedParams = {
        columnId: payload.payload?.columnId,
        title: payload.payload?.title,
        position: payload.payload?.position,
      };

      const result = await this.columnService.updateColumn(mergedParams);
      return { status: 'success', correlationId: payload.correlationId, data: result };
    } catch (error: any) {
      this.logger.error(`[handleUpdateColumn] Failed: ${error.message}`, error.stack);
      return { status: 'error', message: error.message };
    }
  }

  /** 🔴 Xóa column */
  @MessagePattern({ cmd: 'project.column.delete' })
  async handleDeleteColumn(@Payload() payload: any) {
    this.logger.log(`[handleDeleteColumn] Payload: ${JSON.stringify(payload)}`);
    try {
      const columnId = payload.payload?.columnId || payload.columnId;
      const result = await this.columnService.removeColumn(columnId);
      return { status: 'success', correlationId: payload.correlationId, data: result };
    } catch (error: any) {
      this.logger.error(`[handleDeleteColumn] Failed: ${error.message}`, error.stack);
      return { status: 'error', message: error.message };
    }
  }

  /** 🔵 Di chuyển column (move) */
  @MessagePattern({ cmd: 'project.column.move' })
  async handleMoveColumn(@Payload() payload: any) {
    this.logger.log(`[handleMoveColumn] Received payload: ${JSON.stringify(payload)}`);

    try {
      const mergedParams = {
        projectId: payload.projectId,
        columnId: payload.payload?.columnId,
        sourceBoardId: payload.payload?.srcBoardId,
        targetBoardId: payload.payload?.destBoardId,
        newPosition: payload.payload?.destIndex,
        movedById: payload.movedById || payload.createdById,
      };

      this.logger.debug(`[handleMoveColumn] Final params: ${JSON.stringify(mergedParams)}`);

      const result = await this.columnService.moveColumn(mergedParams);

      this.logger.log(`[handleMoveColumn] Success: ${JSON.stringify(result)}`);
      return { status: 'success', correlationId: payload.correlationId, data: result };
    } catch (error: any) {
      this.logger.error(`[handleMoveColumn] Failed: ${error.message}`, error.stack);
      return { status: 'error', message: error.message, correlationId: payload?.correlationId };
    }
  }

  @MessagePattern({ cmd: 'project.column.restore' })
  async handleRestoreColumn(@Payload() payload: any) {
    this.logger.log(`[handleRestoreColumn] Payload: ${JSON.stringify(payload)}`);
    try {
      const columnId = payload.payload?.columnId || payload.columnId;
      const result = await this.columnService.restoreColumn(columnId);
      return { success: true, data: result };
    } catch (error: any) {
      this.logger.error(`[handleRestoreColumn] Failed: ${error.message}`, error.stack);
      return { status: 'error', message: error.message };
    }
  }
}
