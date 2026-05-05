import { Module, forwardRef } from '@nestjs/common';
import { HomeController } from './home.controller';
import { HomeService } from './home.service';
import { AiModule } from '../ai/ai.module';

// Internal implementations
import { HomeMessageHandler } from './internal/message-handlers/home.message-handler';
import { HomeService as InternalHomeService } from './internal/services/home.service';
import { SocialService as InternalSocialService } from './internal/services/social.service';
import { AutoPostService as InternalAutoPostService } from './internal/services/auto-post.service';

@Module({
  imports: [forwardRef(() => AiModule)],
  controllers: [HomeController],
  providers: [
    HomeService,
    HomeMessageHandler,
    InternalHomeService,
    InternalSocialService,
    InternalAutoPostService,
  ],
  exports: [HomeService],
})
export class HomeModule {}
