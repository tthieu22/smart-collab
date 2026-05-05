import { Module } from '@nestjs/common';
import { HomeService } from './services/home.service';
import { SocialService } from './services/social.service';
import { AutoPostService } from './services/auto-post.service';
import { HomeController } from './controllers/home.controller';
import { SocialController } from './controllers/social.controller';
import { SearchController } from './controllers/search.controller';
import { AutoPostController } from './controllers/auto-post.controller';
import { PrismaModule } from '../../../../prisma/prisma.module';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    PrismaModule,
    ScheduleModule.forRoot(),
  ],
  controllers: [
    HomeController,
    SocialController,
    SearchController,
    AutoPostController,
  ],
  providers: [
    HomeService,
    SocialService,
    AutoPostService,
  ],
  exports: [HomeService, SocialService, AutoPostService],
})
export class HomeModule {}
