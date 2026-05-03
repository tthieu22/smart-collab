// rabbitmq.config.ts
import { ConfigService } from '@nestjs/config';
import { RmqOptions, Transport } from '@nestjs/microservices';

// 👉 Cho NestJS microservices (ClientsModule)
export const getRabbitMQOptions = (
  queue: string,
  configService: ConfigService,
): RmqOptions => ({
  transport: Transport.RMQ,
  options: {
    urls: [
      String(configService.get('RABBITMQ_URL') ||
      `amqp://${configService.get('RABBITMQ_USER')}:${configService.get(
        'RABBITMQ_PASSWORD',
      )}@${configService.get('RABBITMQ_HOST')}:${configService.get(
        'RABBITMQ_PORT',
      )}`),
    ],
    queue,
    queueOptions: { durable: true },
  },
});

// 👉 Cho golevelup/nestjs-rabbitmq (event bus)
export const getGolevelupRabbitMQOptions = (configService: ConfigService) => ({
  exchanges: [{ name: 'smart-collab', type: 'topic' }],
  uri: String(configService.get('RABBITMQ_URL') || `amqp://${configService.get('RABBITMQ_USER')}:${configService.get(
    'RABBITMQ_PASSWORD',
  )}@${configService.get('RABBITMQ_HOST')}:${configService.get(
    'RABBITMQ_PORT',
  )}`),
  connectionInitOptions: { wait: false },
});
