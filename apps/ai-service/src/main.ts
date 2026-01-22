import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';
import { getNestRabbitMQOptions } from './config/rabbitmq.config';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  logger.log('App module created');
const config = app.get(ConfigService);

  // Lấy config kết nối RabbitMQ
  const rmqOptions = getNestRabbitMQOptions('ai_queue', config);

  // Kết nối microservice RabbitMQ
  app.connectMicroservice(rmqOptions);

  // Start microservice listener
  await app.startAllMicroservices();
  logger.log('Microservices started');

  logger.log('🤖 AI microservice listening RabbitMQ');
  
}

bootstrap();
