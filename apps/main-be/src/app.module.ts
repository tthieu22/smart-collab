import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppModule as GatewayModule } from '../../api-gateway/src/app.module';
import { AuthModule } from '../../auth/src/auth.module';
import { ProjectModule } from '../../project/src/project.module';
import { RealtimeModule } from '../../realtime/src/realtime.module';
import { ScheduleModule } from '@nestjs/schedule';
import { HomeModule } from '../../auth/src/modules/home/home.module';

import { AppController } from './app.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ 
      isGlobal: true,
      envFilePath: ['.env', 'apps/main-be/.env'],
    }),
    ScheduleModule.forRoot(),
    GatewayModule,
    AuthModule,
    ProjectModule,
    RealtimeModule,
    HomeModule,
  ],
  controllers: [AppController],
})
export class MainBeModule {}
