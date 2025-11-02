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

@Module({
  imports: [
    PrismaModule,
    BoardModule,
    ConfigModule.forRoot({ isGlobal: true }),
    SharedRabbitMQModule
  ],
  providers: [ProjectConsumer,ProjectService, ProjectMemberConsumer, ColumnService, ColumnConsumer],
})
export class ProjectModule {}
