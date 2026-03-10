import {
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
  Inject,
  Logger,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom, timeout, retry } from 'rxjs';

@Controller('projects')
@UseGuards(JwtAuthGuard)
export class AiController {
  private readonly logger = new Logger(AiController.name);

  constructor(
    @Inject('AI_SERVICE')
    private readonly aiClient: ClientProxy,
  ) {}

  /**
   * POST /projects/ai-build
   * Body: { prompt: string }
   */
  @Post('ai-build')
  async buildProject(@Body('prompt') prompt: string, @Req() req: any) {
    const user = req.user;

    this.logger.log(`🚀 AI BUILD PROJECT by user ${user.id}`);

     const result = await firstValueFrom(
      this.aiClient
        .send(
          { cmd: 'ai.build-project' },
          {
            prompt,
            ownerId: user.userId,
            locale: 'vi',
          },
        )
        .pipe(timeout(200000)),
    );

    /**
     * Expected response:
     * {
     *   status: 'BOARD_READY',
     *   project,
     *   board
     * }
     */
    return result;
  }
}
