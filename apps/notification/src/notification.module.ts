import { Module } from '@nestjs/common';
import { PostgresPrismaModule } from '@libs/prisma-postgres';
import { RedisModule } from '@libs/redis';
import { RabbitMQModule } from '@libs/rabbitmq';
import { MailerModule } from '@libs/mailer';
import { NotificationService } from './notification.service';

@Module({
  imports: [PostgresPrismaModule, RedisModule, RabbitMQModule, MailerModule],
  providers: [NotificationService],
})
export class NotificationModule {}
