import { Body, Controller, Get, Inject, Param, Patch } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';

@Controller('projects')
export class CardController {
  
  constructor(
    @Inject('PROJECT_SERVICE') private readonly projectClient: ClientProxy,
  ) {}

  @Get('card/:id')
  async getDetail(@Param('id') id: string) {
    try {
      const result = await firstValueFrom(
        this.projectClient.send({cmd: 'project.get.card'}, id),
      );
      return result;
    } catch (error: any) {
      console.error(`[CardController] getDetail error:`, error); // log lỗi nếu có
      throw error;
    }
  }

  // Thêm API lấy danh sách card theo columnId
  @Get('column/:columnId')
  async getCardsByColumn(@Param('columnId') columnId: string) {
    try {
      const result = await firstValueFrom(
        this.projectClient.send({ cmd: 'project.get.cardsByColumn' }, columnId),
      );
      return result;
    } catch (error: any) {
      console.error(`[CardController] getCardsByColumn error:`, error);
      throw error;
    }
  }
}
