import {
  Controller,
  Post,
  Body,
  UseGuards,
  Patch,
  Delete,
  Inject,
  Logger,
  Param,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';

@Controller('projects/columns')
@UseGuards(JwtAuthGuard)
export class ColumnController {
  private readonly logger = new Logger(ColumnController.name);

  constructor(
    @Inject('PROJECT_SERVICE') private readonly projectClient: ClientProxy,
  ) {}

  @Patch('update')
  async updateColumn(@Body() body: any) {
    this.logger.log(`Received update column request: ${JSON.stringify(body)}`);
    const result = await firstValueFrom(
      this.projectClient.send({ cmd: 'project.column.update' }, { payload: body }),
    );
    return result;
  }

  @Delete('delete')
  async deleteColumn(@Body() body: { columnId: string }) {
    this.logger.log(`Received delete column request: ${JSON.stringify(body)}`);
    const result = await firstValueFrom(
      this.projectClient.send({ cmd: 'project.column.delete' }, { payload: body }),
    );
    return result;
  }
}
