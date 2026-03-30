import {
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
  Patch,
  Inject,
  Logger,
  Get,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Public } from '../auth/decorators/roles.decorator'; // import decorator Public
import { Project } from './dto/project.dto';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom, timeout } from 'rxjs';

@Controller('projects')
@UseGuards(JwtAuthGuard) 
export class ProjectController {
  private readonly logger = new Logger(ProjectController.name);

  constructor(
    @Inject('PROJECT_SERVICE') private readonly projectClient: ClientProxy,
  ) {}

  /** CREATE PROJECT */
  @Post()
  async create(@Body() body: Project, @Req() req: any) {
    this.logger.log(`Received create project request: ${JSON.stringify(body)}`);
    const user = req.user;
    const dto = { ...body, ownerId: user.userId };
    this.logger.log(`Sending create project DTO: ${JSON.stringify(dto)}`);

    const result = await firstValueFrom(
      this.projectClient.send({ cmd: 'project.create' }, dto),
    );

    this.logger.log(`Create project response: ${JSON.stringify(result)}`);
    return result;
  }

  /** UPDATE PROJECT */
  @Patch('update')
  async update(@Body() body: Project) {
    this.logger.log(`Received update project request: ${JSON.stringify(body)}`);

    const result = await firstValueFrom(
      this.projectClient.send({ cmd: 'project.update' }, body),
    );

    this.logger.log(`Update project response: ${JSON.stringify(result)}`);
    return result;
  }

  /** GET PROJECT - public route */
  @Public()
  @Post('get')
  async getProject(@Body() body: Project,  @Req() req: any) {
    this.logger.log(`Received get project request: ${JSON.stringify(body)}`);

    // User có thể không có, vì route public
    const userId = req.user?.userId;
    const dto = { ...body, userId };
    const result = await firstValueFrom(
      this.projectClient.send({ cmd: 'project.get' }, dto),
    );

    this.logger.log(`Get project response: ${JSON.stringify(result)}`);
    return result;
  }

  /** GET ALL PROJECTS - public route */
  @Public()
  @Post('get-all')
  async getAllProjects(@Body() body: { userId?: string }, @Req() req: any) {
    const userId = req.user?.userId;
    const dto = { ...body, userId };
    this.logger.log(`Received get-all projects request: ${JSON.stringify(dto)}`);

    const result = await firstValueFrom(
      this.projectClient.send({ cmd: 'project.get_all' }, dto),
    );

    this.logger.log(`Get-all projects response: ${JSON.stringify(result)}`);
    return result;
  }
  
  /** GET ALL PROJECTS - public route */
  @Public()
  @Get('card')
  async getCardById(@Body() body: { cardId?: string }, @Req() req: any) {
    const userId = req.user?.userId;
    const dto = { ...body, userId };
    this.logger.log(`Received get-all projects request: ${JSON.stringify(dto)}`);

    const result = await firstValueFrom(
      this.projectClient.send({ cmd: 'project.get.card' }, dto),
    );

    this.logger.log(`Get-all projects response: ${JSON.stringify(result)}`);
    return result;
  }


  /**
   * POST /projects/ai-build
   * Body: { prompt: string }
   */
  // @Post('ai-build')
  // async buildProject(@Body('prompt') prompt: string, @Req() req: any) {
  //   const user = req.user;

  //   this.logger.log(`🚀 AI BUILD PROJECT by user ${user.id}`);

  //     const result = await firstValueFrom(
  //     this.projectClient
  //       .send(
  //         { cmd: 'ai.build-project' },
  //         {
  //           prompt,
  //           ownerId: user.userId,
  //           locale: 'vi',
  //         },
  //       )
  //       .pipe(timeout(200000)),
  //   );

  //   /**
  //    * Expected response:
  //    * {
  //    *   status: 'BOARD_READY',
  //    *   project,
  //    *   board
  //    * }
  //    */
  //   return result;
  // }
}
