import { NestFactory } from '@nestjs/core';
import { AiModule } from './ai.module';
import { ConfigService } from '@nestjs/config';
import { rabbitmqConfig } from './config/rabbitmq.config';

async function bootstrap() {
  const app = await NestFactory.create(AiModule);

  const configService = app.get(ConfigService);
  const nodeEnv = configService.get<string>('NODE_ENV') ?? 'development';

  if (nodeEnv === 'development') {
    console.log(`[AI Service] NODE_ENV=${nodeEnv}`);
  }

  app.connectMicroservice(rabbitmqConfig(configService, 'ai_queue'));

  await app.startAllMicroservices();

  console.log(`AI Service is running (microservice) on queue 'ai_queue'`);
}
bootstrap();
