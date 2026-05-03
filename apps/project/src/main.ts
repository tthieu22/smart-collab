import { NestFactory } from '@nestjs/core';
import { ProjectModule } from './project.module';
import { Logger } from '@nestjs/common';
import { getNestRabbitMQOptions } from './config/rabbitmq.config';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  const app = await NestFactory.create(ProjectModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  logger.log('App module created');

  const config = app.get(ConfigService);

  // Listen project commands/events
  app.connectMicroservice(getNestRabbitMQOptions('project_queue', config));

  // Listen AI commands (migrated from ai-service)
  app.connectMicroservice(getNestRabbitMQOptions('ai_queue', config));

  // Start microservice listener
  await app.startAllMicroservices();
  logger.log('Microservices started');

  // Khởi tạo app mà không listen port (Pure Microservice)
  await app.init();
  
  logger.log(
    '🚀 Project Service is running (project_queue + ai_queue) as a pure Microservice',
  );
}

bootstrap();
