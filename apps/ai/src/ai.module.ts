import { Module } from '@nestjs/common';
import { RedisModule } from '@libs/redis';
import { RabbitMQModule } from '@libs/rabbitmq';
import { AiService } from './ai.service';

@Module({
  imports: [RedisModule, RabbitMQModule],
  providers: [AiService],
})
export class AiModule {}
