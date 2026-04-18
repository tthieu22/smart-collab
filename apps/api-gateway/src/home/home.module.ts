import { Module } from '@nestjs/common';
import { HomeController } from './home.controller';

import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule } from '@nestjs/microservices';
import { getRabbitMQOptions } from '../config/rabbitmq.config';
import { RolesGuard } from '../auth/guards/roles.guard';

@Module({
  imports: [
    ClientsModule.registerAsync([
      {
        name: 'HOME_SERVICE',
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (configService: ConfigService) =>
          getRabbitMQOptions('home_requests_queue', configService),
      },
    ]),
  ],
  controllers: [HomeController],
  providers: [RolesGuard],
})
export class HomeModule {}
