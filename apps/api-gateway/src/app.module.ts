import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { PassportModule } from '@nestjs/passport';
import { EventEmitterModule } from '@nestjs/event-emitter';

import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { ProjectModule } from './project/project.module';
import { RealtimeModule } from './realtime/realtime.module';
import { HomeModule } from './home/home.module';
import { UploadModule } from './upload/upload.module';
import { AiModule } from './ai/ai.module';
import { UserModule } from './user/user.module';
import { SearchModule } from './search/search.module';
import { HealthModule } from './health/health.module';
import { InMemoryCacheService } from './services/common/in-memory-cache.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    EventEmitterModule.forRoot(),
    PrismaModule,
    
    ThrottlerModule.forRoot({
      throttlers: [{ ttl: 60, limit: 100 }],
    }),

    PassportModule.register({ defaultStrategy: 'jwt' }),

    AuthModule,
    ProjectModule,
    RealtimeModule,
    HomeModule,
    UserModule,
    UploadModule,
    AiModule,
    SearchModule,
    HealthModule,
  ],
  providers: [InMemoryCacheService],
  exports: [InMemoryCacheService],
})
export class AppModule {}
