// rabbitmq.config.ts
import { ConfigService } from '@nestjs/config';
import { Transport, RmqOptions } from '@nestjs/microservices';

export const createRabbitMQClient = (queue: string, configService: ConfigService): RmqOptions => ({
  transport: Transport.RMQ,
  options: {
    urls: [
      `amqp://${configService.get('RABBITMQ_USER')}:${configService.get('RABBITMQ_PASSWORD')}@${configService.get('RABBITMQ_HOST')}:${configService.get('RABBITMQ_PORT')}`,
    ],
    queue,
    queueOptions: { durable: true },
  },
});
