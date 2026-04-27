import {
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
  Inject,
  Logger,
  Param,
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

  /**
   * POST /projects/cards/:cardId/ai-generate
   * Body: { type: 'title' | 'description' | 'comment' }
   */
  @Post('cards/:cardId/ai-generate')
  async aiGenerateCard(
    @Param('cardId') cardId: string,
    @Body('type') type: 'title' | 'description' | 'comment',
    @Req() req: any,
  ) {
    const user = req.user;

    const result = await firstValueFrom(
      this.aiClient
        .send(
          { cmd: 'ai.generate-card' },
          {
            cardId,
            type,
            userId: user.userId,
            locale: 'vi',
          },
        )
        .pipe(timeout(200000)),
    );

    return result;
  }

  /**
   * POST /projects/:id/ai-analyze-board
   */
  @Post(':id/ai-analyze-board')
  async analyzeBoard(@Param('id') boardId: string, @Req() req: any) {
    const result = await firstValueFrom(
      this.aiClient
        .send(
          { cmd: 'ai.analyze-board' },
          {
            boardId,
            userId: req.user.userId,
            locale: 'vi',
          },
        )
        .pipe(timeout(200000)),
    );

    return result;
  }

  /**
   * POST /projects/:id/ai-ask-board
   */
  @Post(':id/ai-ask-board')
  async askBoard(@Param('id') boardId: string, @Body('query') query: string, @Req() req: any) {
    const result = await firstValueFrom(
      this.aiClient
        .send(
          { cmd: 'ai.ask-board' },
          {
            boardId,
            query,
            userId: req.user.userId,
            locale: 'vi',
          },
        )
        .pipe(timeout(200000)),
    );

    return result;
  }

  /**
   * POST /projects/ai-chat
   */
  @Post('ai-chat')
  async aiChat(@Body('question') question: string, @Req() req: any) {
    const result = await firstValueFrom(
      this.aiClient
        .send(
          { cmd: 'ai.chat' },
          {
            question,
            userId: req.user.userId,
          },
        )
        .pipe(timeout(120000), retry(1)),
    );

    return result;
  }

  /**
   * POST /projects/ai-optimize-post
   */
  @Post('ai-optimize-post')
  async aiOptimizePost(@Body('content') content: string) {
    const result = await firstValueFrom(
      this.aiClient
        .send(
          { cmd: 'ai.optimize-post' },
          {
            content,
            locale: 'vi',
          },
        )
        .pipe(timeout(60000)),
    );

    return result;
  }
}
