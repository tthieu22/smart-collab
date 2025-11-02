import { Body, Controller, Get, Inject, Param, Patch } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';

@Controller('project/card')
export class CardController {
  
  constructor(
    @Inject('PROJECT_SERVICE') private readonly projectClient: ClientProxy,
  ) {}
  @Get(':id')
  async getDetail(@Param('id') id: string) {
    try {
      const result = await firstValueFrom(
        this.projectClient.send({cmd: 'project.get.card'}, id),
      );
      return result;
    } catch (error: any) {
      throw error;
    }
  }
}
