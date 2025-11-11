import { NestFactory } from '@nestjs/core';
import { ProjectModule } from './project.module';
import { Logger } from '@nestjs/common';
import { rabbitmqConfig } from './config/rabbitmq.config';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  const app = await NestFactory.create(ProjectModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  logger.log('App module created');

  // Lấy config kết nối RabbitMQ
  const rmqOptions = rabbitmqConfig('project_queue');

  // Kết nối microservice RabbitMQ
  app.connectMicroservice(rmqOptions);

  // Start microservice listener
  await app.startAllMicroservices();
  logger.log('Microservices started');

  // Nếu cần expose HTTP API thì listen port
  await app.listen(3002);
  logger.log('HTTP server listening on port 3002');

  logger.log('🚀 Project Service is running and listening to RabbitMQ events');
}

bootstrap();
