import { Controller, Get, Param } from '@nestjs/common';
import { ProjectService } from '../project.service';
  @Controller('projects')
export class CardController {
  constructor(
    private readonly projectService: ProjectService,
  ) {}

  @Get('card/:id')
  async getDetail(@Param('id') id: string) {
    try {
      return await this.projectService.send({cmd: 'project.get.card'}, id);
    } catch (error: any) {
      console.error(`[CardController] getDetail error:`, error);
      throw error;
    }
  }

  @Get('column/:columnId')
  async getCardsByColumn(@Param('columnId') columnId: string) {
    try {
      return await this.projectService.send({ cmd: 'project.get.cardsByColumn' }, columnId);
    } catch (error: any) {
      console.error(`[CardController] getCardsByColumn error:`, error);
      throw error;
    }
  }

  @Get('columns/project/:projectId')
  async getColumnsByProject(@Param('projectId') projectId: string) {
    try {
      return await this.projectService.send({ cmd: 'project.get.columnsByProject' }, projectId);
    } catch (error: any) {
      console.error(`[CardController] getColumnsByProject error:`, error);
      throw error;
    }
  }

  @Get('columns/board/:boardId')
  async getColumnsByBoard(@Param('boardId') boardId: string) {
    try {
      return await this.projectService.send({ cmd: 'project.get.columnsByBoard' }, boardId);
    } catch (error: any) {
      console.error(`[CardController] getColumnsByBoard error:`, error);
      throw error;
    }
  }
}
