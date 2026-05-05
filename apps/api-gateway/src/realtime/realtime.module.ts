import { Module, Global } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';

import { RealtimeGateway } from './internal/realtime.gateway';
import { LockService } from './internal/services/lock.service';
import { CardService } from './internal/services/project/card.service';
import { ColumnService } from './internal/services/project/column.service';
import { BoardService } from './internal/services/project/board.service';
import { MemberService } from './internal/services/project/member.service';
import { MeetingService } from './internal/services/project/meeting.service';
import { ProjectConsumer } from './internal/services/project.consumer';
import { InMemoryCacheService } from '../services/common/in-memory-cache.service';

@Global()
@Module({
  imports: [
    ConfigModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '1d' },
      }),
    }),
  ],
  providers: [
    RealtimeGateway,
    LockService,
    BoardService,
    CardService,
    ColumnService,
    MemberService,
    MeetingService,
    ProjectConsumer,
    InMemoryCacheService,
  ],
  exports: [RealtimeGateway, LockService],
})
export class RealtimeModule {}
