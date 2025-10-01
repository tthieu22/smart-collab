import { NestFactory } from '@nestjs/core';
import { TaskModule } from './task.module';
import { ConfigService } from '@nestjs/config';
import { rabbitmqConfig } from './config/rabbitmq.config';

async function bootstrap() {
  const app = await NestFactory.create(TaskModule);

  const configService = app.get(ConfigService);
  const nodeEnv = configService.get<string>('NODE_ENV') ?? 'development';

  if (nodeEnv === 'development') {
    console.log(`[Task Service] NODE_ENV=${nodeEnv}`);
  }

  app.connectMicroservice(rabbitmqConfig(configService, 'task_queue'));

  await app.startAllMicroservices();

  console.log(`Task Service is running (microservice) on queue 'task_queue'`);
}
bootstrap();
