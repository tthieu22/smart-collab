import { NestFactory } from '@nestjs/core';
import { AuthModule } from './auth.module';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';
import { rabbitmqConfig } from './config/rabbitmq.config';
import { MicroserviceOptions } from '@nestjs/microservices';

async function bootstrap() {
  
  const app = await NestFactory.create(AuthModule);
  app.connectMicroservice(rabbitmqConfig('auth_queue'));
  await app.startAllMicroservices();
  await app.listen(3001);
}
bootstrap();