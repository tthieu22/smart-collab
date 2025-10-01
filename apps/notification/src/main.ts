import { NestFactory } from '@nestjs/core';
import { NotificationModule } from './notification.module';
import { ConfigService } from '@nestjs/config';
import { rabbitmqConfig } from './config/rabbitmq.config';

async function bootstrap() {
  const app = await NestFactory.create(NotificationModule);

  const configService = app.get(ConfigService);
  const nodeEnv = configService.get<string>('NODE_ENV') ?? 'development';

  if (nodeEnv === 'development') {
    console.log(`[Notification Service] NODE_ENV=${nodeEnv}`);
  }

  app.connectMicroservice(rabbitmqConfig(configService, 'notification_queue'));

  await app.startAllMicroservices();

  console.log(`Notification Service is running (microservice) on queue 'notification_queue'`);
}
bootstrap();
