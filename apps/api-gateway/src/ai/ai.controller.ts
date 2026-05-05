import {
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
  Logger,
  Param,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AiService } from './ai.service';

@Controller('projects')
@UseGuards(JwtAuthGuard)
export class AiController {
  private readonly logger = new Logger(AiController.name);

  constructor(private readonly aiService: AiService) {}

  @Post('ai-build')
  async buildProject(@Body('prompt') prompt: string, @Req() req: any) {
    const user = req.user;
    return this.aiService.send(
      { cmd: 'ai.build-project' },
      {
        prompt,
        ownerId: user.userId,
        locale: 'vi',
      },
    );
  }

  @Post('cards/:cardId/ai-generate')
  async aiGenerateCard(
    @Param('cardId') cardId: string,
    @Body('type') type: 'title' | 'description' | 'comment',
    @Req() req: any,
  ) {
    const user = req.user;
    return this.aiService.send(
      { cmd: 'ai.generate-card' },
      {
        cardId,
        type,
        userId: user.userId,
        locale: 'vi',
      },
    );
  }

  @Post(':id/ai-analyze-board')
  async analyzeBoard(@Param('id') boardId: string, @Req() req: any) {
    return this.aiService.send(
      { cmd: 'ai.analyze-board' },
      {
        boardId,
        userId: req.user.userId,
        locale: 'vi',
      },
    );
  }

  @Post(':id/ai-ask-board')
  async askBoard(@Param('id') boardId: string, @Body('query') query: string, @Req() req: any) {
    return this.aiService.send(
      { cmd: 'ai.ask-board' },
      {
        boardId,
        query,
        userId: req.user.userId,
        locale: 'vi',
      },
    );
  }

  @Post('ai-chat')
  async aiChat(@Body('question') question: string, @Req() req: any) {
    return this.aiService.send(
      { cmd: 'ai.chat' },
      {
        question,
        userId: req.user.userId,
      },
    );
  }

  @Post('ai-optimize-post')
  async aiOptimizePost(@Body('content') content: string) {
    return this.aiService.send(
      { cmd: 'ai.optimize-post' },
      {
        content,
        locale: 'vi',
      },
    );
  }
}
