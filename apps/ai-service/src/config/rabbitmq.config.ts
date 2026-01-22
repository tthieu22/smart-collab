import { ConfigService } from '@nestjs/config';
import { RmqOptions, Transport } from '@nestjs/microservices';

/**
 * ✅ NestJS Microservice (Transport.RMQ)
 */
export const getNestRabbitMQOptions = (
  queue: string,
  config: ConfigService,
): RmqOptions => ({
  transport: Transport.RMQ,
  options: {
    urls: [
      `amqp://${config.get('RABBITMQ_USER')}:${config.get(
        'RABBITMQ_PASSWORD',
      )}@${config.get('RABBITMQ_HOST')}:${config.get(
        'RABBITMQ_PORT',
      )}`,
    ],
    queue,
    queueOptions: { durable: true },
  },
});

/**
 * ✅ golevelup/nestjs-rabbitmq (Event Bus)
 */
export const getGolevelupRabbitMQOptions = (config: ConfigService) => ({
  exchanges: [{ name: 'project-exchange', type: 'topic' }],
  uri: `amqp://${config.get('RABBITMQ_USER')}:${config.get(
    'RABBITMQ_PASSWORD',
  )}@${config.get('RABBITMQ_HOST')}:${config.get(
    'RABBITMQ_PORT',
  )}`,
  connectionInitOptions: { wait: false },
});
