import { Module, Global } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';

import { RealtimeGateway } from './realtime.gateway';
import { LockService } from './services/lock.service';
import { CardService } from './services/project/card.service';
import { ColumnService } from './services/project/column.service';
import { BoardService } from './services/project/board.service';
import { MemberService } from './services/project/member.service';
import { MeetingService } from './services/project/meeting.service';
import { ProjectConsumer } from './services/project.consumer';
import { PrismaModule } from '../../prisma/prisma.module';

@Global()
@Module({
  imports: [
    ConfigModule,
    PrismaModule,
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
  ],
  exports: [RealtimeGateway, LockService],
})
export class RealtimeModule {}