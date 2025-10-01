import { ConfigService } from '@nestjs/config';
import { RmqOptions, Transport } from '@nestjs/microservices';

export const getNestRabbitMQOptions = (
  queue: string,
  configService: ConfigService,
): RmqOptions => ({
  transport: Transport.RMQ,
  options: {
    urls: [
      `amqp://${configService.get('RABBITMQ_USER')}:${configService.get(
        'RABBITMQ_PASSWORD',
      )}@${configService.get('RABBITMQ_HOST')}:${configService.get(
        'RABBITMQ_PORT',
      )}`,
    ],
    queue,
    queueOptions: { durable: true },
  },
});

export const getGolevelupRabbitMQOptions = (configService: ConfigService) => ({
  exchanges: [{ name: 'smart-collab', type: 'topic' }],
  uri: `amqp://${configService.get('RABBITMQ_USER')}:${configService.get(
    'RABBITMQ_PASSWORD',
  )}@${configService.get('RABBITMQ_HOST')}:${configService.get(
    'RABBITMQ_PORT',
  )}`,
  connectionInitOptions: { wait: false },
});
