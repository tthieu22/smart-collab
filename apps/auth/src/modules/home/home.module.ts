import { Module } from '@nestjs/common';
import { HomeService } from './services/home.service';
import { SocialService } from './services/social.service';
import { AutoPostService } from './services/auto-post.service';
import { HomeController } from './controllers/home.controller';
import { SocialController } from './controllers/social.controller';
import { SearchController } from './controllers/search.controller';
import { AutoPostController } from './controllers/auto-post.controller';
import { AuthPrismaModule } from '../../../prisma/prisma.module';
import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    AuthPrismaModule,
    ScheduleModule.forRoot(),
    RabbitMQModule.forRoot({
      exchanges: [
        {
          name: 'notification_exchange',
          type: 'topic',
        },
      ],
      uri: process.env.RABBITMQ_URL || 'amqp://localhost:5672',
      connectionInitOptions: { wait: false },
    }),
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
  exports: [HomeService, SocialService, AutoPostService, RabbitMQModule],
})
export class HomeModule {}
