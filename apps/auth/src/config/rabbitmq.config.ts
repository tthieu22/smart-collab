import { RmqOptions, Transport } from '@nestjs/microservices';

export const rabbitmqConfig = (queue: string): RmqOptions => ({
  transport: Transport.RMQ,
  options: {
    urls: [
      String(process.env.RABBITMQ_URL ||
        `amqp://${process.env.RABBITMQ_USER}:${process.env.RABBITMQ_PASSWORD}@${process.env.RABBITMQ_HOST}:${process.env.RABBITMQ_PORT}`),
    ] as string[],
    queue,
    queueOptions: {
      durable: true,
    },
  },
});
