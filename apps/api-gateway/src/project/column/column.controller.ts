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
import { ProjectService } from '../project.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@Controller('projects/columns')
@UseGuards(JwtAuthGuard)
export class ColumnController {
  private readonly logger = new Logger(ColumnController.name);

  constructor(
    private readonly projectService: ProjectService,
  ) {}

  @Patch('update')
  async updateColumn(@Body() body: any) {
    this.logger.log(`Received update column request: ${JSON.stringify(body)}`);
    return await this.projectService.send({ cmd: 'project.column.update' }, { payload: body });
  }

  @Delete('delete')
  async deleteColumn(@Body() body: { columnId: string }) {
    this.logger.log(`Received delete column request: ${JSON.stringify(body)}`);
    return await this.projectService.send({ cmd: 'project.column.delete' }, { payload: body });
  }
}
