import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ProjectConsumer } from './project.consumer';
import { PrismaModule } from '../prisma/project.module';
import { ProjectMemberConsumer } from './project.member.consumer';
import { BoardModule } from './board/board.module';
import { SharedRabbitMQModule } from './config/rabbitmq.module';
import { ProjectService } from './project.service';
import { ColumnConsumer } from './column/column.consumer';
import { ColumnService } from './column/column.service';
// import { CardConsumer } from './card/card.consumer';
import { CardService } from './card/card.service';
import { CardHandler } from './card/card.handle';
import { ProjectHandler } from './project.handle';
import { ColumnHandler } from './column/column.handler';

@Module({
  imports: [
    PrismaModule,
    BoardModule,
    ConfigModule.forRoot({ isGlobal: true }),
    SharedRabbitMQModule,
  ],
  controllers: [CardHandler, ProjectHandler, ColumnHandler],

  providers: [
    ProjectConsumer,
    ProjectService,
    ProjectMemberConsumer,
    ColumnService,
    ColumnConsumer,
    // CardConsumer,
    CardService,
  ],
})
export class ProjectModule {}
