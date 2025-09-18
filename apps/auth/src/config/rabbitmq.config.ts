import { ConfigService } from '@nestjs/config';
import { RmqOptions, Transport } from '@nestjs/microservices';

export const rabbitmqConfig = (
  configService: ConfigService,
  queueName: string,
): RmqOptions => ({
  transport: Transport.RMQ,
  options: {
    urls: [
      configService.get<string>('RABBITMQ_URL') ??
      `amqp://${configService.get('RABBITMQ_USER')}:${configService.get('RABBITMQ_PASSWORD')}@${configService.get('RABBITMQ_HOST')}:${configService.get('RABBITMQ_PORT')}`,
    ],
    queue: queueName,
    queueOptions: {
      durable: true,
    },
  },
});
