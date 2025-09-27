import { NestFactory } from '@nestjs/core';
import { AuthModule } from './auth.module';
import { rabbitmqConfig } from './config/rabbitmq.config';

async function bootstrap() {
  const app = await NestFactory.create(AuthModule);
  app.connectMicroservice(rabbitmqConfig('auth_queue'));
  await app.startAllMicroservices();
  await app.listen(3001);
}
bootstrap();