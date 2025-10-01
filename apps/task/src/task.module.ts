import { Module } from '@nestjs/common';
import { PostgresPrismaModule } from '@libs/prisma-postgres';
import { RabbitMQModule } from '@libs/rabbitmq';
import { TaskController } from './task.controller';

@Module({
  imports: [PostgresPrismaModule, RabbitMQModule],
  controllers: [TaskController],
})
export class TaskModule {}
