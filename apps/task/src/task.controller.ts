import { Controller, Get } from '@nestjs/common';

@Controller('tasks')
export class TaskController {
  @Get()
  async list() {
    return [{ id: 't1', title: 'Example Task' }];
  }
}
