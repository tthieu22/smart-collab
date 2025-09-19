import { Global, Module } from '@nestjs/common';
import { ClientsModule, Transport, ClientProviderOptions } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';

@Global()
@Module({})
export class RabbitMQModule {
  static register(queueName: string) {
    return ClientsModule.registerAsync([
      {
        name: `${queueName.toUpperCase()}_CLIENT`, // ✅ thêm name
        imports: [],
        inject: [ConfigService],
        useFactory: (configService: ConfigService): ClientProviderOptions => ({
          name: `${queueName.toUpperCase()}_CLIENT`,
          transport: Transport.RMQ,
          options: {
            urls: [
              configService.get<string>('RABBITMQ_URL') ||
                `amqp://${configService.get('RABBITMQ_USER')}:${configService.get('RABBITMQ_PASSWORD')}@${configService.get('RABBITMQ_HOST')}:${configService.get('RABBITMQ_PORT')}`,
            ],
            queue: queueName,
            queueOptions: { durable: true },
          },
        }),
      },
    ]);
  }
}
